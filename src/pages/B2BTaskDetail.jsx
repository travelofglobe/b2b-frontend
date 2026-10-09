import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskManagementService } from '../services/taskManagementService';
import { useAuth } from '../context/AuthContext';
import { getTaskTypeLabel } from '../utils/taskTypeDictionary';
import CreateTaskModal from '../components/CreateTaskModal';


const statusConfig = {
    OPEN: { label: 'Açık', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
    IN_PROGRESS: { label: 'İşleniyor', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
    WAITING_FOR_SUPPLIER: { label: 'Tedarikçi Bekleniyor', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
    WAITING_FOR_AGENCY: { label: 'Onayınız Bekleniyor', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 animate-pulse', dot: 'bg-orange-500' },
    APPROVED: { label: 'Onaylandı', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Reddedildi', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800', dot: 'bg-rose-500' },
    COMPLETED: { label: 'Tamamlandı', bg: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', dot: 'bg-green-500' },
    CANCELLED: { label: 'İptal Edildi', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700', dot: 'bg-slate-400' }
};

const priorityConfig = {
    LOW: { label: 'Düşük', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200' },
    NORMAL: { label: 'Normal', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300 border-blue-200' },
    HIGH: { label: 'Yüksek', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200' },
    URGENT: { label: 'Acil', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-300 border-rose-300' }
};

const productIcons = {
    HOTEL: 'hotel',
    FLIGHT: 'flight',
    TRANSFER: 'directions_car',
    TRAIN: 'train',
    RENT_A_CAR: 'car_rental',
    GENERAL: 'support_agent'
};

const PAGE_SIZE = 10;

const isImageAttachment = (att) => {
    const name = att?.fileOriginalName || att?.fileName || '';
    const type = att?.contentType || '';
    if (type?.startsWith('image/')) return true;
    return /\.(jpg|jpeg|png|webp|gif|svg|bmp)$/i.test(name);
};

const ImageAttachmentPreview = ({ attachment, isFromMe = false, onPreview }) => {
    const [blobUrl, setBlobUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const fileName = attachment.fileOriginalName || attachment.fileName || 'Görsel';

    useEffect(() => {
        let active = true;
        let objectUrl = null;

        const loadBlob = async () => {
            try {
                setLoading(true);
                const url = await taskManagementService.getAttachmentBlobUrl(attachment.id);
                if (active) {
                    objectUrl = url;
                    setBlobUrl(url);
                    setLoading(false);
                }
            } catch (err) {
                if (active) {
                    console.error('Failed to load image blob:', err);
                    setError(true);
                    setLoading(false);
                }
            }
        };

        loadBlob();

        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [attachment.id]);

    if (error || (!loading && !blobUrl)) {
        return (
            <button
                type="button"
                onClick={() => taskManagementService.downloadAttachment(attachment.id, fileName)}
                className={`w-full min-w-[200px] max-w-full flex items-center gap-2.5 p-2 px-3 rounded-xl ${
                    isFromMe
                        ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                        : 'bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10'
                } text-[12px] font-medium transition-all cursor-pointer shadow-xs text-left group`}
            >
                <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[17px]">image</span>
                </div>
                <div className="flex-1 min-w-0">
                    <span className="block truncate font-semibold leading-tight text-[12px]">{fileName}</span>
                    <span className="text-[10px] opacity-75 block mt-0.5">İndirmek için tıklayın</span>
                </div>
                <span className="material-symbols-outlined text-[16px] opacity-80 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all shrink-0">download</span>
            </button>
        );
    }

    return (
        <div className="relative group/img rounded-xl overflow-hidden max-w-[280px] w-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 my-1 shadow-xs">
            {loading ? (
                <div className="w-[220px] h-[130px] flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                    <span className="material-symbols-outlined text-[22px] animate-spin text-blue-500">progress_activity</span>
                    <span className="text-[11px]">Görsel yükleniyor...</span>
                </div>
            ) : (
                <div 
                    className="relative cursor-pointer group"
                    onClick={() => onPreview({ url: blobUrl, name: fileName, id: attachment.id })}
                >
                    <img
                        src={blobUrl}
                        alt={fileName}
                        className="w-full max-h-[220px] object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="size-10 rounded-full bg-black/70 text-white flex items-center justify-center shadow-lg backdrop-blur-xs">
                            <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                        </div>
                    </div>
                    {/* Caption Bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-2 pt-4 flex items-center justify-between text-white text-[11px]">
                        <span className="truncate max-w-[180px] font-medium drop-shadow-xs">{fileName}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                taskManagementService.downloadAttachment(attachment.id, fileName);
                            }}
                            className="p-1 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors ml-1 shrink-0"
                            title="İndir"
                        >
                            <span className="material-symbols-outlined text-[14px]">download</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const B2BTaskDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    const userDisplayName = (user?.name || user?.surname)
        ? `${user.name || ''} ${user.surname || ''}`.trim()
        : (user?.fullName || user?.email || 'Acente Kullanıcısı');

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // { url, name, id }
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Chat compose state
    const [messageText, setMessageText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);

    // Confirmation decision state
    const [decisionNote, setDecisionNote] = useState('');
    const [submittingDecision, setSubmittingDecision] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [pendingApprovalState, setPendingApprovalState] = useState(null); // true = approve, false = reject

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounterRef = useRef(0);
    const fileInputRef = useRef(null);
    const prevScrollHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const isPrependingRef = useRef(false);
    const prevTotalChatItemsRef = useRef(0);
    const initialScrollDoneRef = useRef(false);

    useEffect(() => {
        initialScrollDoneRef.current = false;
        prevTotalChatItemsRef.current = 0;
        setVisibleCount(PAGE_SIZE);
        fetchTaskDetail();
    }, [id]);

    const fetchTaskDetail = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            setError(null);
            const data = await taskManagementService.getTaskDetail(id);
            setTask(data);
        } catch (err) {
            console.error('Failed to load task:', err);
            if (!silent) {
                setError(err.response?.data?.message || err.message || 'Talep detayı yüklenemedi.');
            }
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleManualRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchTaskDetail(true);
        } finally {
            setRefreshing(false);
        }
    };

    const allChatItems = useMemo(() => {
        if (!task) return [];
        const msgs = [...(task.messages || [])];

        const attachedIdsInMsgs = new Set();
        msgs.forEach(m => {
            (m.attachments || []).forEach(a => attachedIdsInMsgs.add(a.id));
        });

        const unlinkedAttachments = (task.attachments || []).filter(a => !attachedIdsInMsgs.has(a.id));

        unlinkedAttachments.forEach(att => {
            msgs.push({
                id: `att-${att.id}`,
                senderType: att.uploadedByUserType || 'AGENCY_USER',
                senderName: att.uploadedBy || (att.uploadedByUserType === 'TOG_ADMIN' ? 'TOG Operasyon' : 'Acente'),
                message: '',
                messageType: 'ATTACHMENT',
                isInternal: Boolean(att.isInternal),
                attachments: [att],
                createdAt: att.createdAt
            });
        });

        return msgs.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    }, [task]);

    const visibleChatItems = useMemo(() => {
        if (allChatItems.length <= visibleCount) return allChatItems;
        return allChatItems.slice(-visibleCount);
    }, [allChatItems, visibleCount]);

    const hasMoreOlder = allChatItems.length > visibleCount;

    const loadOlderMessages = () => {
        if (!hasMoreOlder || isLoadingOlder || !chatContainerRef.current) return;
        setIsLoadingOlder(true);
        prevScrollHeightRef.current = chatContainerRef.current.scrollHeight;
        prevScrollTopRef.current = chatContainerRef.current.scrollTop;
        isPrependingRef.current = true;

        setVisibleCount(prev => Math.min(prev + PAGE_SIZE, allChatItems.length));
        setIsLoadingOlder(false);
    };

    const handleChatScroll = (e) => {
        if (e.target.scrollTop < 40 && hasMoreOlder && !isLoadingOlder && !isPrependingRef.current) {
            loadOlderMessages();
        }
    };

    useLayoutEffect(() => {
        if (!chatContainerRef.current) return;

        if (isPrependingRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            chatContainerRef.current.scrollTop = prevScrollTopRef.current + diff;
            isPrependingRef.current = false;
            return;
        }

        const totalCount = allChatItems.length;
        const isNewMessage = totalCount > prevTotalChatItemsRef.current && prevTotalChatItemsRef.current > 0;

        if (!initialScrollDoneRef.current || isNewMessage) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            if (totalCount > 0) {
                initialScrollDoneRef.current = true;
            }
        }
        prevTotalChatItemsRef.current = totalCount;
    }, [visibleChatItems, allChatItems.length]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (task && ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(task.taskStatus)) {
            return;
        }
        const text = messageText.trim();
        const files = [...selectedFiles];
        if (!text && files.length === 0) return;

        // Clear input immediately for snappy messaging feel
        setMessageText('');
        setSelectedFiles([]);

        try {
            setSending(true);
            // 1. Send text message if provided
            let messageId = null;
            if (text) {
                const msgRes = await taskManagementService.addMessage(id, {
                    message: text,
                    messageType: 'TEXT',
                    senderName: userDisplayName,
                    senderUserId: user?.id
                });
                messageId = msgRes?.data?.id || msgRes?.id;
            }

            // 2. Upload files if any
            if (files.length > 0) {
                for (const f of files) {
                    await taskManagementService.uploadAttachment(id, f, messageId, userDisplayName);
                }
            }

            // Reload silently in background without screen flicker or unmounting
            await fetchTaskDetail(true);
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Mesaj gönderilemedi: ' + (err.response?.data?.message || err.message));
            setMessageText(text);
            setSelectedFiles(files);
        } finally {
            setSending(false);
        }
    };

    const handleDecisionConfirm = async () => {
        if (!task || pendingApprovalState === null) return;

        try {
            setSubmittingDecision(true);
            const decision = pendingApprovalState ? 'CONFIRMED' : 'REJECTED';
            const updated = await taskManagementService.processDecision(id, decision, decisionNote);
            setTask(updated);
            setShowDecisionModal(false);
            setDecisionNote('');
            setPendingApprovalState(null);
        } catch (err) {
            console.error('Failed to process confirmation decision:', err);
            alert('İşlem gerçekleştirilemedi: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingDecision(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
        }
        if (e.target) {
            e.target.value = '';
        }
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current += 1;
        if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current <= 0) {
            dragCounterRef.current = 0;
            setIsDragging(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer?.files || []);
        if (droppedFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...droppedFiles]);
        }
    };

    const removeSelectedFile = (idx) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="size-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-500">Talep detayı yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="flex-1 p-8">
                <div className="max-w-xl mx-auto p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center space-y-3">
                    <span className="material-symbols-outlined text-[40px] text-rose-600">error</span>
                    <h3 className="text-base font-bold text-rose-900 dark:text-rose-200">Talep Bulunamadı</h3>
                    <p className="text-xs text-rose-700 dark:text-rose-300">{error || 'Talep verisi alınamadı.'}</p>
                    <button
                        onClick={() => navigate('/task-management')}
                        className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer"
                    >
                        Talepler Listesine Dön
                    </button>
                </div>
            </div>
        );
    }

    const status = statusConfig[task.taskStatus] || statusConfig.OPEN;
    const priority = priorityConfig[task.priority] || priorityConfig.NORMAL;
    const productDetail = task.productDetail;
    const productIcon = productIcons[task.productType] || 'category';

    let requestedChangeData = {};
    try {
        if (productDetail?.requestedDataJson) {
            requestedChangeData = JSON.parse(productDetail.requestedDataJson);
        }
    } catch (e) {
        requestedChangeData = {};
    }

    let currentData = {};
    try {
        if (productDetail?.currentDataJson) {
            currentData = JSON.parse(productDetail.currentDataJson);
        }
    } catch (e) {
        currentData = {};
    }

    const isClosed = Boolean(task && ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(task.taskStatus));

    const bookingData = useMemo(() => {
        if (!task) return null;
        return {
            orderId: task.reservationNo || task.bookingId,
            reservationNo: task.reservationNo,
            id: task.bookingId,
            productName: productDetail?.productName || task.title,
            supplierName: productDetail?.supplierName,
            hotel: {
                hotelName: productDetail?.productName,
                supplierName: productDetail?.supplierName,
                checkIn: currentData?.checkIn,
                checkOut: currentData?.checkOut,
                roomName: currentData?.optionName
            },
            holderName: currentData?.primaryGuest
        };
    }, [task, productDetail, currentData]);

    return (
        <div className="flex-1 bg-[#f8f9fa] dark:bg-[#18191c] overflow-y-auto font-roboto p-6 sm:p-10 lg:px-16 xl:px-20 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Top Nav & Breadcrumb */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/task-management')}
                            className="size-9 rounded-xl bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px] text-blue-600">
                                    {productIcon}
                                </span>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Talep #{task.taskNumber || task.id}
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${status.bg}`}>
                                    {status.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${priority.color}`}>
                                    {priority.label}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Oluşturulma: {task.createdAt ? new Date(task.createdAt).toLocaleString('tr-TR') : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Right side: Price Difference Status Pill */}
                    <div className="flex items-center gap-3">
                        {productDetail?.confirmationStatus === 'CONFIRMED' && (
                            <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 shadow-2xs animate-in fade-in-50">
                                <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                <span className="font-medium">Fiyat farkı (<strong>+{productDetail.priceDifference} {productDetail.currency}</strong>) onaylandı.</span>
                            </div>
                        )}

                        {productDetail?.confirmationStatus === 'REJECTED' && (
                            <div className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 shadow-2xs animate-in fade-in-50">
                                <span className="material-symbols-outlined text-rose-600 text-[18px]">cancel</span>
                                <span className="font-medium">Fiyat farkı reddedildi.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price Difference Action Banner (Only shown when pending confirmation) */}
                {productDetail?.confirmationStatus === 'PENDING_CONFIRMATION' && (
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg space-y-3 animate-in fade-in-50 duration-300">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[28px]">payments</span>
                                <div>
                                    <h3 className="font-bold text-sm">Fiyat Farkı Onayı Bekleniyor</h3>
                                    <p className="text-xs text-amber-100">Operasyon ekibi bu talep için fiyat farkı bildirdi</p>
                                </div>
                            </div>
                            <span className="text-xl font-black bg-white/20 px-3 py-1 rounded-xl">
                                +{productDetail.priceDifference} {productDetail.currency || 'EUR'}
                            </span>
                        </div>

                        {productDetail.confirmationNote && (
                            <div className="p-3 bg-white/10 rounded-xl text-xs backdrop-blur-xs">
                                <strong>Operasyon Notu:</strong> {productDetail.confirmationNote}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                onClick={() => {
                                    setPendingApprovalState(false);
                                    setShowDecisionModal(true);
                                }}
                                className="py-2 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                                <span>Farkı Reddet</span>
                            </button>
                            <button
                                onClick={() => {
                                    setPendingApprovalState(true);
                                    setShowDecisionModal(true);
                                }}
                                className="py-2 px-3 rounded-xl bg-white text-orange-600 hover:bg-orange-50 text-xs font-black shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                <span>Farkı Onayla</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Summary & Details (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* 1. Reservation & Product Card */}
                        <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    {task.productType} Rezervasyon Özeti
                                </span>
                                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                                    Rez: #{task.reservationNo || '-'}
                                </span>
                            </div>

                            <div className="space-y-2.5 text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[11px]">Ürün / Otel / Hat:</span>
                                    <strong className="text-slate-900 dark:text-white text-sm font-bold block">
                                        {productDetail?.productName || task.productType}
                                    </strong>
                                </div>

                                {productDetail?.supplierName && (
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Tedarikçi:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{productDetail.supplierName}</span>
                                    </div>
                                )}

                                {currentData?.checkIn && (
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Tarihler:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">
                                             {currentData.checkIn} {currentData.checkOut ? `➔ ${currentData.checkOut}` : ''}
                                        </span>
                                    </div>
                                )}

                                {currentData?.primaryGuest && (
                                    <div>
                                        <span className="text-slate-400 block text-[11px]">Misafir / Yolcu:</span>
                                        <span className="font-medium text-slate-700 dark:text-slate-300">{currentData.primaryGuest}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Request Details & Dynamic JSON */}
                        <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Talep Bilgileri</span>
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                                    {getTaskTypeLabel(task, i18n.language)}
                                </span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[11px] mb-1">İlk Talep Açıklaması:</span>
                                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#28292c] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {task.description}
                                    </div>
                                </div>

                                {/* Dynamic requested changes breakdown */}
                                {requestedChangeData.newDateStart && (
                                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                                        <span className="text-blue-900 dark:text-blue-300 font-bold block mb-1">İstenen Yeni Tarihler:</span>
                                        <span className="text-blue-700 dark:text-blue-400 font-semibold">
                                            {requestedChangeData.newDateStart} {requestedChangeData.newDateEnd ? `➔ ${requestedChangeData.newDateEnd}` : ''}
                                        </span>
                                    </div>
                                )}

                                {requestedChangeData.guestNameChanges && (
                                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                                        <span className="text-blue-900 dark:text-blue-300 font-bold block mb-1">İsim Değişikliği:</span>
                                        <span className="text-slate-500 line-through mr-2">{requestedChangeData.guestNameChanges.oldName}</span>
                                        <span className="text-emerald-600 font-bold">➔ {requestedChangeData.guestNameChanges.newName}</span>
                                    </div>
                                )}

                                {requestedChangeData.newOptionPreference && (
                                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                                        <span className="text-blue-900 dark:text-blue-300 font-bold block mb-1">Talep Edilen Tercih / Upgrade:</span>
                                        <span className="text-blue-700 dark:text-blue-400 font-semibold">{requestedChangeData.newOptionPreference}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Attachments Card */}
                        {task.attachments && task.attachments.length > 0 && (
                            <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-3 shadow-xs">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                                    Ekli Belgeler ({task.attachments.length})
                                </span>
                                <div className="space-y-2">
                                    {task.attachments.map(att => (
                                        <button
                                            key={att.id}
                                            type="button"
                                            onClick={() => taskManagementService.downloadAttachment(att.id, att.fileOriginalName || att.fileName)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#28292c] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors group cursor-pointer text-xs text-left"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="material-symbols-outlined text-[18px] text-blue-600">description</span>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">
                                                    {att.fileOriginalName || att.fileName}
                                                </span>
                                            </div>
                                            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-blue-600">download</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Chat Timeline */}
                    <div className="lg:col-span-7">
                        
                        {/* Chat Card */}
                        <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[520px]">
                        
                        {/* Chat Header */}
                        <div className="px-6 py-4 bg-slate-50 dark:bg-[#28292c] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-[20px] text-blue-600">forum</span>
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Operasyon İletişim Akışı
                                    </h3>
                                    <p className="text-[11px] text-slate-400">
                                        TOG Operasyon ekibiyle canlı mesajlaşma ve dosya paylaşımı
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chat Messages Timeline */}
                        <div 
                            ref={chatContainerRef}
                            onScroll={handleChatScroll}
                            className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-[#1c1c1e]"
                            style={{ '--chat-bg': '#ffffff', '--chat-bg-dark': '#1c1c1e' }}
                        >
                            {/* Reverse infinite loading indicator / button */}
                            {hasMoreOlder ? (
                                <div className="flex justify-center py-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={loadOlderMessages}
                                        disabled={isLoadingOlder}
                                        className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                                    >
                                        {isLoadingOlder ? (
                                            <>
                                                <span className="material-symbols-outlined text-[15px] text-blue-500 animate-spin">progress_activity</span>
                                                <span>Önceki mesajlar yükleniyor...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[15px] text-blue-500">history</span>
                                                <span>Daha eski mesajları göster ({allChatItems.length - visibleCount} mesaj daha)</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                allChatItems.length > PAGE_SIZE && (
                                    <div className="text-center py-2 text-[10px] text-slate-400 font-medium shrink-0">
                                        — Konuşmanın başlangıcı —
                                    </div>
                                )
                            )}

                            {(!visibleChatItems || visibleChatItems.length === 0) ? (
                                <div className="text-center py-12 text-slate-400 text-xs">
                                    <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">chat</span>
                                    Henüz mesaj bulunmuyor.
                                </div>
                            ) : (
                                visibleChatItems.map((msg) => {
                                    const isAgency = msg.senderType === 'AGENCY_USER';
                                    const isSystem = msg.messageType === 'STATUS_CHANGE' || msg.messageType === 'SYSTEM';
                                    const isPriceOffer = msg.messageType === 'PRICE_OFFER';

                                    if (isSystem) {
                                        const statusMatch = msg.message?.match(/Durum güncellendi:\s*([A-Z_]+)\s*->\s*([A-Z_]+)(?:\.\s*Not:\s*(.*))?/i);

                                        if (statusMatch) {
                                            const oldStatus = statusMatch[1]?.trim();
                                            const newStatus = statusMatch[2]?.trim();
                                            const note = statusMatch[3]?.trim();

                                            const oldConf = statusConfig[oldStatus] || { label: oldStatus, bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600' };
                                            const newConf = statusConfig[newStatus] || { label: newStatus, bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700' };

                                            return (
                                                <div key={msg.id} className="flex flex-col items-center justify-center my-3 gap-1.5">
                                                    <div className="px-3.5 py-1.5 rounded-full bg-slate-50 dark:bg-[#28292c] text-slate-600 dark:text-slate-300 text-[11px] font-medium flex flex-wrap items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                                                        <span className="material-symbols-outlined text-[15px] text-blue-500">sync_alt</span>
                                                        <span className="font-semibold text-slate-500 dark:text-slate-400">Durum Güncellendi:</span>
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${oldConf.bg}`}>
                                                            {oldConf.label}
                                                        </span>
                                                        <span className="text-slate-400 font-bold text-[11px]">➔</span>
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${newConf.bg}`}>
                                                            {newConf.label}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 ml-1">
                                                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                    </div>
                                                    {note && (
                                                        <div className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-amber-50/60 dark:bg-amber-950/20 px-3 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/40 text-center max-w-[85%]">
                                                            "{note}"
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={msg.id} className="flex items-center justify-center my-2">
                                                <div className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                                                    <span className="material-symbols-outlined text-[14px]">info</span>
                                                    <span>{msg.message}</span>
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${isAgency ? 'items-end' : 'items-start'} my-2`}
                                        >
                                            {isPriceOffer ? (
                                                <div className="max-w-[85%] sm:max-w-[78%] rounded-[20px] rounded-tl-[4px] p-4 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white shadow-md space-y-2 border border-amber-400/30">
                                                    <div className="flex items-center gap-2 pb-1.5 border-b border-white/20">
                                                        <span className="material-symbols-outlined text-[18px]">payments</span>
                                                        <span className="font-bold text-xs uppercase tracking-wider">Fiyat Farkı Bildirimi</span>
                                                        <span className="text-[10px] text-amber-100 ml-auto font-medium">
                                                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                    </div>
                                                    <div className="text-[13px] sm:text-[14px] leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                                                </div>
                                            ) : isAgency ? (
                                                <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] min-w-0">
                                                    <div className="imessage-bubble from-me">
                                                        {msg.message && (
                                                            <div className="whitespace-pre-wrap select-text leading-relaxed break-normal">
                                                                {msg.message}
                                                            </div>
                                                        )}

                                                        {/* Attachments */}
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className={`${msg.message ? 'mt-2 pt-2 border-t border-white/25' : ''} space-y-1.5 w-full`}>
                                                                {msg.attachments.map(a => isImageAttachment(a) ? (
                                                                    <ImageAttachmentPreview
                                                                        key={a.id}
                                                                        attachment={a}
                                                                        isFromMe={true}
                                                                        onPreview={setPreviewImage}
                                                                    />
                                                                ) : (
                                                                    <button
                                                                        key={a.id}
                                                                        type="button"
                                                                        title={a.fileOriginalName || a.fileName}
                                                                        onClick={() => taskManagementService.downloadAttachment(a.id, a.fileOriginalName || a.fileName)}
                                                                        className="w-full min-w-[200px] max-w-full flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[12px] font-medium transition-all cursor-pointer border border-white/20 text-left group"
                                                                    >
                                                                        <div className="size-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                                                            <span className="material-symbols-outlined text-[17px]">description</span>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <span className="block truncate font-semibold leading-tight text-[12px]">{a.fileOriginalName || a.fileName}</span>
                                                                            <span className="text-[10px] opacity-75 block mt-0.5">İndirmek için tıklayın</span>
                                                                        </div>
                                                                        <span className="material-symbols-outlined text-[16px] opacity-80 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all shrink-0">download</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%] min-w-0">
                                                    <span className="text-[11px] text-slate-400 font-semibold mb-1 px-1">
                                                        {msg.senderName || 'TOG Operasyon'}
                                                    </span>
                                                    <div className="imessage-bubble from-them">
                                                        {msg.message && (
                                                            <div className="whitespace-pre-wrap select-text leading-relaxed break-normal">
                                                                {msg.message}
                                                            </div>
                                                        )}

                                                        {/* Attachments */}
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className={`${msg.message ? 'mt-2 pt-2 border-t border-black/10 dark:border-white/10' : ''} space-y-1.5 w-full`}>
                                                                {msg.attachments.map(a => isImageAttachment(a) ? (
                                                                    <ImageAttachmentPreview
                                                                        key={a.id}
                                                                        attachment={a}
                                                                        isFromMe={false}
                                                                        onPreview={setPreviewImage}
                                                                    />
                                                                ) : (
                                                                    <button
                                                                        key={a.id}
                                                                        type="button"
                                                                        title={a.fileOriginalName || a.fileName}
                                                                        onClick={() => taskManagementService.downloadAttachment(a.id, a.fileOriginalName || a.fileName)}
                                                                        className="w-full min-w-[200px] max-w-full flex items-center gap-2.5 p-2 px-3 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] text-slate-800 dark:text-slate-100 text-[12px] font-medium transition-all cursor-pointer border border-slate-200/80 dark:border-white/10 shadow-xs text-left group"
                                                                    >
                                                                        <div className="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                                            <span className="material-symbols-outlined text-[17px]">description</span>
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <span className="block truncate font-semibold leading-tight text-slate-900 dark:text-white text-[12px]">{a.fileOriginalName || a.fileName}</span>
                                                                            <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5">İndirmek için tıklayın</span>
                                                                        </div>
                                                                        <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400 group-hover:translate-y-0.5 transition-all shrink-0">download</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Composer / Closed Task Banner */}
                        {isClosed ? (
                            <div className="p-4 bg-slate-50 dark:bg-[#202124] border-t border-slate-200 dark:border-slate-700 shrink-0">
                                <div className="p-3.5 rounded-xl bg-slate-100/90 dark:bg-[#28292c] border border-slate-200/90 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                                    <div className="flex items-center gap-3 text-left">
                                        <div className="size-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                            <span className="material-symbols-outlined text-[20px]">lock</span>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                {t('taskManagement.drawer.closedNoticeTitle', 'Bu talep kapatılmıştır')} ({status.label})
                                            </h4>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                {t('taskManagement.drawer.closedNoticeDesc', 'Tamamlandı, İptal Edildi veya Reddedildi statüsündeki bir talebe tekrar mesaj yazılamaz. Yeni bir işlem için lütfen yeni talep oluşturunuz.')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                                    >
                                        <span className="material-symbols-outlined text-[17px]">add_circle</span>
                                        <span>{t('taskManagement.drawer.createNewTask', 'Yeni Talep Oluştur')}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="p-3 bg-[#F9F9FB] dark:bg-[#1C1C1E] border-t border-slate-200/80 dark:border-[#2C2C2E] space-y-2 shrink-0">
                                
                                {/* Selected file preview (iOS pill chips) */}
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 px-1 pb-0.5">
                                        {selectedFiles.map((f, i) => (
                                            <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-[#3A3A3C] shadow-2xs">
                                                <span className="material-symbols-outlined text-[15px] text-[#007AFF]">attachment</span>
                                                <span className="truncate max-w-[130px] font-medium">{f.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSelectedFile(i)}
                                                    className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        multiple
                                        className="hidden"
                                    />

                                    {/* iOS Style Attachment / Media Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        title="Dosya / Görsel Ekle"
                                        className="size-9 rounded-full bg-slate-200/80 hover:bg-slate-300/80 dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                                    </button>

                                    {/* Refresh Button - iOS subtle circular action */}
                                    <button
                                        type="button"
                                        onClick={handleManualRefresh}
                                        disabled={refreshing}
                                        title="Akışı Yenile"
                                        className="size-9 rounded-full bg-slate-200/80 hover:bg-slate-300/80 dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
                                    >
                                        <span className={`material-symbols-outlined text-[19px] ${refreshing ? 'animate-spin text-[#007AFF]' : ''}`}>refresh</span>
                                    </button>

                                    {/* iOS iMessage Capsule Container */}
                                    <div className="flex-1 flex items-center min-h-[40px] pl-4 pr-1.5 py-1 rounded-full border border-slate-300/80 dark:border-[#3A3A3C] bg-white dark:bg-[#2C2C2E] focus-within:ring-2 focus-within:ring-[#007AFF]/25 focus-within:border-[#007AFF] transition-all duration-200 shadow-2xs">
                                        <input
                                            type="text"
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder="Operasyon ekibine mesaj yazın..."
                                            className="flex-1 bg-transparent text-[13.5px] leading-relaxed text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#8E8E93] focus:outline-none border-none py-1 pr-2 font-normal"
                                        />

                                        {/* iOS Circular Send Button with Upward Arrow */}
                                        <button
                                            type="submit"
                                            disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
                                            aria-label="Gönder"
                                            title="Gönder"
                                            className={`size-8 rounded-full flex items-center justify-center transition-all shrink-0 select-none ${
                                                (!messageText.trim() && selectedFiles.length === 0)
                                                    ? 'bg-slate-300/60 dark:bg-[#3A3A3C] text-slate-400 dark:text-[#636366] cursor-not-allowed opacity-60'
                                                    : 'bg-[#007AFF] hover:bg-[#006ee6] text-white shadow-xs cursor-pointer active:scale-90'
                                            }`}
                                        >
                                            {sending ? (
                                                <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <svg 
                                                    className="w-4 h-4 translate-y-[-0.5px]" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    strokeWidth="3.2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round"
                                                >
                                                    <line x1="12" y1="19" x2="12" y2="5" />
                                                    <polyline points="5 12 12 5 19 12" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            </div>

            {/* Decision Confirmation Modal */}
            {showDecisionModal && (
                <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#202124] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${pendingApprovalState ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                <span className="material-symbols-outlined text-[24px]">
                                    {pendingApprovalState ? 'check_circle' : 'cancel'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {pendingApprovalState ? 'Fiyat Farkını Onayla' : 'Fiyat Farkını Reddet'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    +{productDetail?.priceDifference} {productDetail?.currency} tutarındaki fark için kararınız
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Karar Notunuz (Opsiyonel):
                            </label>
                            <textarea
                                rows={3}
                                value={decisionNote}
                                onChange={(e) => setDecisionNote(e.target.value)}
                                placeholder="Operasyona iletmek istediğiniz not..."
                                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDecisionModal(false);
                                    setDecisionNote('');
                                }}
                                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                Vazgeç
                            </button>
                            <button
                                type="button"
                                disabled={submittingDecision}
                                onClick={handleDecisionConfirm}
                                className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-xs cursor-pointer ${
                                    pendingApprovalState ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                                }`}
                            >
                                {submittingDecision ? 'İşleniyor...' : (pendingApprovalState ? 'Onaylıyorum' : 'Reddediyorum')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Fullscreen Lightbox Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[1000000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    {/* Top Floating Control Bar */}
                    <div 
                        className="absolute top-4 inset-x-4 max-w-4xl mx-auto flex items-center justify-between z-10 px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-white shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-2 truncate pr-4">
                            <span className="material-symbols-outlined text-blue-400 text-[20px]">image</span>
                            <span className="text-sm font-semibold truncate">{previewImage.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={() => taskManagementService.downloadAttachment(previewImage.id, previewImage.name)}
                                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-blue-600 text-white transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                                title="İndir"
                            >
                                <span className="material-symbols-outlined text-[17px]">download</span>
                                <span>İndir</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="p-1.5 rounded-xl bg-white/15 hover:bg-red-600 text-white transition-all cursor-pointer flex items-center justify-center"
                                title="Kapat (ESC)"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Big Image View */}
                    <div className="max-w-[92vw] max-h-[84vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                        <img
                            src={previewImage.url}
                            alt={previewImage.name}
                            className="max-w-full max-h-[84vh] object-contain rounded-xl shadow-2xl transition-transform"
                        />
                    </div>
                </div>
            )}

            {/* Create New Task Modal */}
            {showCreateModal && (
                <CreateTaskModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    booking={bookingData}
                    productType={task.productType || 'HOTEL'}
                    onSuccess={(newTask) => {
                        setShowCreateModal(false);
                        if (newTask?.id) {
                            navigate(`/task-management/${newTask.id}`);
                        } else {
                            fetchTaskDetail(true);
                        }
                    }}
                />
            )}
        </div>
    );
};

export default B2BTaskDetail;

