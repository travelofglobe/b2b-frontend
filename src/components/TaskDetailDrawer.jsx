import React, { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskManagementService } from '../services/taskManagementService';
import { useAuth } from '../context/AuthContext';
import { getTaskTypeLabel } from '../utils/taskTypeDictionary';
import CreateTaskModal from './CreateTaskModal';


const statusConfig = {
    OPEN: { label: 'Açık', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-800/70', dot: 'bg-blue-500' },
    IN_PROGRESS: { label: 'İşleniyor', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/70', dot: 'bg-amber-500' },
    WAITING_FOR_SUPPLIER: { label: 'Tedarikçi Bekleniyor', bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/70 dark:border-purple-800/70', dot: 'bg-purple-500' },
    WAITING_FOR_AGENCY: { label: 'Onayınız Bekleniyor', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200/70 dark:border-orange-800/70 animate-pulse', dot: 'bg-orange-500' },
    APPROVED: { label: 'Onaylandı', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/70', dot: 'bg-emerald-500' },
    REJECTED: { label: 'Reddedildi', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-800/70', dot: 'bg-rose-500' },
    COMPLETED: { label: 'Tamamlandı', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/70', dot: 'bg-emerald-500' },
    CANCELLED: { label: 'İptal Edildi', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700', dot: 'bg-slate-400' }
};

const priorityConfig = {
    LOW: { label: 'Düşük', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70' },
    NORMAL: { label: 'Normal', color: 'text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/70 dark:border-sky-800/70' },
    HIGH: { label: 'Yüksek', color: 'text-amber-800 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/70 dark:border-amber-800/70' },
    URGENT: { label: 'Acil', color: 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300/70 dark:border-rose-800/70' }
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

const TaskDetailDrawer = ({ taskId, initialTask = null, isOpen, onClose, onUpdated }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const userDisplayName = (user?.name || user?.surname)
        ? `${user.name || ''} ${user.surname || ''}`.trim()
        : (user?.fullName || user?.email || 'Acente Kullanıcısı');

    const [task, setTask] = useState(initialTask || null);
    const [loading, setLoading] = useState(!initialTask);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'details' | 'attachments'
    const [previewImage, setPreviewImage] = useState(null); // { url, name, id }
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Chat compose state
    const [messageText, setMessageText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);

    // Decision state
    const [decisionNote, setDecisionNote] = useState('');
    const [submittingDecision, setSubmittingDecision] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [pendingApprovalState, setPendingApprovalState] = useState(null);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);
    const prevScrollHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);
    const isPrependingRef = useRef(false);
    const prevTotalChatItemsRef = useRef(0);
    const initialScrollDoneRef = useRef(false);
    const prevTaskIdRef = useRef(null);

    useEffect(() => {
        if (isOpen && taskId) {
            if (prevTaskIdRef.current !== taskId) {
                prevTaskIdRef.current = taskId;
                initialScrollDoneRef.current = false;
                prevTotalChatItemsRef.current = 0;
                setVisibleCount(PAGE_SIZE);
                setLoading(true);
                if (initialTask && initialTask.id === taskId) {
                    setTask(initialTask);
                } else {
                    setTask(null);
                }
                fetchDetail(false);
            }
        } else if (!isOpen) {
            prevTaskIdRef.current = null;
            setMessageText('');
            setSelectedFiles([]);
        }
    }, [isOpen, taskId]);

    const fetchDetail = async (silent = false) => {
        try {
            if (!silent) {
                setLoading(true);
            }
            const data = await taskManagementService.getTaskDetail(taskId);
            setTask(data);
        } catch (err) {
            console.error('Failed to load task detail:', err);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    };

    const handleManualRefresh = async () => {
        try {
            setRefreshing(true);
            const detailPromise = fetchDetail(true);
            const parentPromise = onUpdated ? Promise.resolve(onUpdated()) : Promise.resolve();
            await Promise.all([detailPromise, parentPromise]);
        } catch (err) {
            console.error('Failed to refresh task details:', err);
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
        if (!chatContainerRef.current || activeTab !== 'chat') return;

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
    }, [visibleChatItems, activeTab, allChatItems.length]);

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
                const msgRes = await taskManagementService.addMessage(taskId, {
                    message: text,
                    messageType: 'TEXT',
                    senderName: userDisplayName,
                    senderUserId: user?.id
                });
                messageId = msgRes?.data?.id || msgRes?.id;
            }

            // 2. Upload files if any (linking to messageId if created)
            if (files.length > 0) {
                for (const f of files) {
                    await taskManagementService.uploadAttachment(taskId, f, messageId, userDisplayName);
                }
            }

            // Reload silently in background without screen flicker
            await fetchDetail(true);
            if (onUpdated) onUpdated();
        } catch (err) {
            console.error('Failed to send message:', err);
            alert('Mesaj gönderilemedi: ' + (err.response?.data?.message || err.message));
            setMessageText(text);
            setSelectedFiles(files);
        } finally {
            setSending(false);
        }
    };

    const handleDecisionSubmit = async (e) => {
        e.preventDefault();
        try {
            setSubmittingDecision(true);
            const decision = pendingApprovalState ? 'CONFIRMED' : 'REJECTED';
            await taskManagementService.processAgencyDecision(
                taskId,
                {
                    approved: pendingApprovalState,
                    note: decisionNote
                },
                user?.id,
                userDisplayName
            );
            setShowDecisionModal(false);
            setDecisionNote('');
            setPendingApprovalState(null);
            await fetchDetail();
            if (onUpdated) onUpdated();
        } catch (err) {
            console.error('Failed to submit decision:', err);
            alert('Karar kaydedilemedi: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmittingDecision(false);
        }
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeSelectedFile = (idx) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    };

    const status = task ? (statusConfig[task.taskStatus] || statusConfig.OPEN) : statusConfig.OPEN;
    const priority = task ? (priorityConfig[task.priority] || priorityConfig.NORMAL) : priorityConfig.NORMAL;
    const productDetail = task?.productDetail;
    const productIcon = task ? (productIcons[task.productType] || 'category') : 'category';

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

    return createPortal(
        <div className={`fixed inset-0 z-[99999] overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/40 dark:bg-black/60 transition-opacity duration-300 ease-in-out cursor-pointer ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Sidebar Drawer (Slides in same as sidebar: transition-transform duration-300 ease-in-out) */}
            <aside 
                className={`fixed top-0 bottom-0 right-0 w-screen max-w-2xl bg-white dark:bg-[#202124] z-[99999] flex flex-col border-l border-[#dadce0] dark:border-slate-800 shadow-2xl overflow-hidden font-roboto transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                    
                    {/* Drawer Header */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-[#28292c] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                <span className="material-symbols-outlined text-[24px]">{productIcon}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        {t('taskManagement.drawer.title', 'Talep')} #{task?.taskNumber || taskId}
                                    </h2>
                                    {task && (
                                        <>
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${status.bg}`}>
                                                {t(`taskManagement.statuses.${task.taskStatus}`, status.label)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${priority.color}`}>
                                                {t(`taskManagement.priorities.${task.priority}`, priority.label)}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {task?.productType ? t(`taskManagement.productTypes.${task.productType}`, task.productType) : t('taskManagement.productTypes.GENERAL', 'Genel Destek')} • {t('taskManagement.table.rez', 'Rez')}: #{task?.reservationNo || '-'} • {task?.createdAt ? new Date(task.createdAt).toLocaleString() : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => navigate(`/task-management/${taskId}`)}
                                title={t('taskManagement.drawer.openFullPage', 'Tam Sayfada Aç')}
                                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </button>
                            <button
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                                title={t('taskManagement.refresh', 'Yenile')}
                                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                            </button>
                            <button
                                onClick={onClose}
                                title={t('taskManagement.drawer.close', 'Kapat')}
                                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    </div>

                    {!task ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="size-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Price Difference Notification Banner (if any) */}
                            {productDetail?.confirmationStatus === 'PENDING_CONFIRMATION' && (
                                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white shrink-0 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[24px]">payments</span>
                                            <div>
                                                <h4 className="font-bold text-xs">
                                                    {t('taskManagement.drawer.priceDiffNotice', 'Fiyat Farkı Onayı Bekleniyor')}
                                                </h4>
                                                <p className="text-[11px] text-amber-100">
                                                    {t('taskManagement.drawer.priceDiffDesc', 'Operasyon ekibi fiyat farkı bildirdi')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-base font-black bg-white/20 px-2.5 py-0.5 rounded-lg">
                                            +{productDetail.priceDifference} {productDetail.currency || 'EUR'}
                                        </span>
                                    </div>
                                    {productDetail.confirmationNote && (
                                        <div className="p-2 bg-white/10 rounded-lg text-[11px] backdrop-blur-xs">
                                            <strong>{t('common.note', 'Not')}:</strong> {productDetail.confirmationNote}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                                        <button
                                            onClick={() => {
                                                setPendingApprovalState(false);
                                                setShowDecisionModal(true);
                                            }}
                                            className="py-1.5 px-3 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                            <span>{t('taskManagement.drawer.rejectDiff', 'Farkı Reddet')}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPendingApprovalState(true);
                                                setShowDecisionModal(true);
                                            }}
                                            className="py-1.5 px-3 rounded-lg bg-white text-orange-600 hover:bg-orange-50 text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                            <span>{t('taskManagement.drawer.approveDiff', 'Farkı Onayla')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {productDetail?.confirmationStatus === 'CONFIRMED' && (
                                <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 shrink-0">
                                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                    <span>{t('taskManagement.drawer.events.priceApproved', 'Fiyat farkı onaylandı')} (<strong>+{productDetail.priceDifference} {productDetail.currency}</strong>).</span>
                                </div>
                            )}

                            {productDetail?.confirmationStatus === 'REJECTED' && (
                                <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 shrink-0">
                                    <span className="material-symbols-outlined text-rose-600 text-[18px]">cancel</span>
                                    <span>{t('taskManagement.drawer.events.priceRejected', 'Fiyat farkı tarafınızca reddedildi')}.</span>
                                </div>
                            )}

                            {/* Tabs Navigation */}
                            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-[#202124] shrink-0">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        activeTab === 'chat'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">forum</span>
                                    <span>{t('taskManagement.drawer.tabMessages', 'Mesajlaşma Akışı')}</span>
                                    <span className="size-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] flex items-center justify-center font-bold">
                                        {allChatItems.length || 0}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        activeTab === 'details'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">info</span>
                                    <span>{t('taskManagement.drawer.tabSummary', 'Rezervasyon & Talep')}</span>
                                </button>

                                <button
                                    onClick={() => setActiveTab('attachments')}
                                    className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                                        activeTab === 'attachments'
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                                    <span>{t('taskManagement.drawer.tabAttachments', 'Dosya Ekleri')} ({task.attachments?.length || 0})</span>
                                </button>
                            </div>

                            {/* Tab 1: Chat Timeline */}
                            {activeTab === 'chat' && (
                                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1c1c1e]">
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
                                                            <span>{t('taskManagement.drawer.loadingOlder', 'Önceki mesajlar yükleniyor...')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-[15px] text-blue-500">history</span>
                                                            <span>{t('taskManagement.drawer.showOlder', 'Daha eski mesajları göster')} ({allChatItems.length - visibleCount})</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            allChatItems.length > PAGE_SIZE && (
                                                <div className="text-center py-2 text-[10px] text-slate-400 font-medium shrink-0">
                                                    {t('taskManagement.drawer.startOfConversation', '— Konuşmanın başlangıcı —')}
                                                </div>
                                            )
                                        )}

                                        {loading ? (
                                            <div className="py-12 flex flex-col items-center justify-center space-y-4">
                                                <div className="size-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin"></div>
                                                <div className="text-center space-y-0.5">
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                                                        {t('taskManagement.drawer.loadingMessages', 'Mesajlar ve talep geçmişi yükleniyor...')}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {t('taskManagement.drawer.loadingSubtitle', 'Lütfen bekleyiniz')}
                                                    </span>
                                                </div>
                                                {/* Visual skeleton bubbles to give instant chat context without 'no message' flicker */}
                                                <div className="w-full max-w-sm space-y-3 pt-2 opacity-75">
                                                    <div className="flex gap-2 items-start">
                                                        <div className="size-7 rounded-full bg-slate-200 dark:bg-slate-700/60 animate-pulse shrink-0"></div>
                                                        <div className="space-y-1.5 flex-1">
                                                            <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse"></div>
                                                            <div className="h-10 w-44 bg-slate-200 dark:bg-slate-700/60 rounded-2xl animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 items-start justify-end">
                                                        <div className="space-y-1.5 flex flex-col items-end flex-1">
                                                            <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700/60 rounded animate-pulse"></div>
                                                            <div className="h-8 w-36 bg-blue-100 dark:bg-blue-900/40 rounded-2xl animate-pulse"></div>
                                                        </div>
                                                        <div className="size-7 rounded-full bg-blue-200 dark:bg-blue-800/60 animate-pulse shrink-0"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (!visibleChatItems || visibleChatItems.length === 0) ? (
                                            <div className="text-center py-12 text-slate-400 text-xs">
                                                <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">chat</span>
                                                {t('taskManagement.drawer.noMessagesYet', 'Henüz mesaj kaydı bulunmuyor.')}
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
                                                                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                                                                        {t('taskManagement.drawer.statusUpdated', 'Durum Güncellendi:')}
                                                                    </span>
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${oldConf.bg}`}>
                                                                        {t(`taskManagement.statuses.${oldStatus}`, oldConf.label)}
                                                                    </span>
                                                                    <span className="text-slate-400 font-bold text-[11px]">➔</span>
                                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${newConf.bg}`}>
                                                                        {t(`taskManagement.statuses.${newStatus}`, newConf.label)}
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
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
                                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
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
                                                                    <span className="font-bold text-xs uppercase tracking-wider">
                                                                        {t('taskManagement.drawer.priceDiffNotice', 'Fiyat Farkı Bildirimi')}
                                                                    </span>
                                                                    <span className="text-[10px] text-amber-100 ml-auto font-medium">
                                                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                                                            </div>
                                                        ) : isAgency ? (
                                                            <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%] min-w-0">
                                                                <div className="imessage-bubble from-me">
                                                                    {msg.message && (
                                                                        <div className="whitespace-pre-wrap select-text leading-relaxed break-normal">
                                                                            {msg.message}
                                                                        </div>
                                                                    )}

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
                                                                                        <span className="text-[10px] opacity-75 block mt-0.5">{t('taskManagement.drawer.downloadPrompt', 'İndirmek için tıklayın')}</span>
                                                                                    </div>
                                                                                    <span className="material-symbols-outlined text-[16px] opacity-80 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all shrink-0">download</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
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
                                                                                        <span className="text-[10px] text-slate-400 dark:text-slate-400 block mt-0.5">{t('taskManagement.drawer.downloadPrompt', 'İndirmek için tıklayın')}</span>
                                                                                    </div>
                                                                                    <span className="material-symbols-outlined text-[16px] text-blue-600 dark:text-blue-400 group-hover:translate-y-0.5 transition-all shrink-0">download</span>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Composer Footer / Closed Notice */}
                                    {isClosed ? (
                                        <div className="p-4 bg-slate-50 dark:bg-[#202124] border-t border-slate-200 dark:border-slate-800 shrink-0">
                                            <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-[#28292c] border border-slate-200/90 dark:border-slate-700/90 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                                                <div className="flex items-center gap-2.5 text-left">
                                                    <div className="size-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                                                        <span className="material-symbols-outlined text-[18px]">lock</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                                            {t('taskManagement.drawer.closedNoticeTitle', 'Bu talep kapatılmıştır')} ({t(`taskManagement.statuses.${task.taskStatus}`, status.label)})
                                                        </h4>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                                            {t('taskManagement.drawer.closedNoticeDesc', 'Tamamlandı, İptal Edildi veya Reddedildi statüsündeki bir talebe tekrar mesaj yazılamaz. Yeni bir işlem için lütfen yeni talep oluşturunuz.')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCreateModal(true)}
                                                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                                    <span>{t('taskManagement.drawer.createNewTask', 'Yeni Talep Oluştur')}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-[#202124] border-t border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
                                            {/* Selected file preview */}
                                            {selectedFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pb-1">
                                                    {selectedFiles.map((f, i) => (
                                                        <div key={i} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-800">
                                                            <span className="material-symbols-outlined text-[14px]">attachment</span>
                                                            <span className="truncate max-w-[120px]">{f.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSelectedFile(i)}
                                                                className="text-blue-500 hover:text-rose-600 cursor-pointer"
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

                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    title={t('taskManagement.drawer.attachFile', 'Dosya / Belge Ekle')}
                                                    className="size-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                                </button>

                                                <input
                                                    type="text"
                                                    value={messageText}
                                                    onChange={(e) => setMessageText(e.target.value)}
                                                    placeholder={t('taskManagement.drawer.typeMessagePlaceholder', 'Operasyon ekibine mesaj yazın...')}
                                                    className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={handleManualRefresh}
                                                    disabled={refreshing}
                                                    title={t('taskManagement.refresh', 'Yenile')}
                                                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-[#28292c] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                                                >
                                                    <span className={`material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                                                    <span className="hidden sm:inline">{t('taskManagement.refresh', 'Yenile')}</span>
                                                </button>

                                                <button
                                                    type="submit"
                                                    disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
                                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0"
                                                >
                                                    {sending ? (
                                                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-[18px]">send</span>
                                                            <span>{t('taskManagement.drawer.send', 'Gönder')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Tab 2: Reservation & Request Details */}
                            {activeTab === 'details' && (
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fa] dark:bg-[#18191c]">
                                    
                                    {/* 1. Reservation Card */}
                                    <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xs">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {t(`taskManagement.productTypes.${task.productType}`, task.productType)} {t('taskManagement.drawer.reservationSummary.title', 'Rezervasyon Özeti')}
                                            </span>
                                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                                                {t('taskManagement.table.rez', 'Rez')}: #{task.reservationNo || '-'}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5 text-xs">
                                            <div>
                                                <span className="text-slate-400 block text-[11px]">{t('taskManagement.drawer.reservationSummary.productName', 'Ürün / Otel / Hat:')}</span>
                                                <strong className="text-slate-900 dark:text-white text-sm font-bold block">
                                                    {productDetail?.productName || task.productType}
                                                </strong>
                                            </div>

                                            {productDetail?.supplierName && (
                                                <div>
                                                    <span className="text-slate-400 block text-[11px]">{t('taskManagement.drawer.reservationSummary.supplier', 'Tedarikçi:')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{productDetail.supplierName}</span>
                                                </div>
                                            )}

                                            {currentData?.checkIn && (
                                                <div>
                                                    <span className="text-slate-400 block text-[11px]">{t('taskManagement.drawer.reservationSummary.checkInDate', 'Tarihler:')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {currentData.checkIn} {currentData.checkOut ? `➔ ${currentData.checkOut}` : ''}
                                                    </span>
                                                </div>
                                            )}

                                            {currentData?.primaryGuest && (
                                                <div>
                                                    <span className="text-slate-400 block text-[11px]">{t('taskManagement.drawer.reservationSummary.guests', 'Misafir / Yolcu:')}</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{currentData.primaryGuest}</span>
                                                </div>
                                            )}

                                            {/* Satış Kanalı Hiyerarşisi */}
                                            {(task.gsaName || task.rsaName || task.agencyName) && (
                                                <div className="pt-3 mt-1 border-t border-slate-200/80 dark:border-slate-700/60">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                                        {t('taskManagement.drawer.reservationSummary.salesChannelHierarchy', 'Satış Kanalı Hiyerarşisi (GSA ➔ RSA ➔ Acente)')}
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700">
                                                        {task.gsaName && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
                                                                <span className="px-1 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white uppercase">GSA</span>
                                                                <span className="font-bold text-amber-900 dark:text-amber-200">{task.gsaName}</span>
                                                            </div>
                                                        )}
                                                        {task.gsaName && (task.rsaName || (task.agencyName && task.agencyName !== task.gsaName)) && (
                                                            <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_right_alt</span>
                                                        )}
                                                        {task.rsaName && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
                                                                <span className="px-1 py-0.5 rounded text-[9px] font-black bg-indigo-600 text-white uppercase">RSA</span>
                                                                <span className="font-bold text-indigo-900 dark:text-indigo-200">{task.rsaName}</span>
                                                            </div>
                                                        )}
                                                        {task.rsaName && task.agencyName && task.agencyName !== task.rsaName && (
                                                            <span className="material-symbols-outlined text-[16px] text-slate-400">arrow_right_alt</span>
                                                        )}
                                                        {task.agencyName && task.agencyName !== task.gsaName && task.agencyName !== task.rsaName && (
                                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs">
                                                                <span className="px-1 py-0.5 rounded text-[9px] font-black bg-blue-600 text-white uppercase">{t('salesChannel.agency', 'Acente')}</span>
                                                                <span className="font-bold text-blue-900 dark:text-blue-200">{task.agencyName}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Request Details */}
                                    <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xs">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {t('taskManagement.drawer.reservationSummary.requestDetails', 'Talep Bilgileri')}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                                                {getTaskTypeLabel(task, i18n.language)}
                                            </span>
                                        </div>

                                        <div className="space-y-3 text-xs">
                                            <div>
                                                <span className="text-slate-400 block text-[11px] mb-1">{t('taskManagement.drawer.reservationSummary.initialDescription', 'İlk Talep Açıklaması:')}</span>
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#28292c] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                    {task.description}
                                                </div>
                                            </div>

                                            {requestedChangeData.newDateStart && (
                                                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                                                    <span className="text-blue-900 dark:text-blue-300 font-bold block mb-1">{t('taskManagement.drawer.reservationSummary.requestedNewDates', 'İstenen Yeni Tarihler:')}</span>
                                                    <span className="text-blue-700 dark:text-blue-400 font-semibold">
                                                        {requestedChangeData.newDateStart} {requestedChangeData.newDateEnd ? `➔ ${requestedChangeData.newDateEnd}` : ''}
                                                    </span>
                                                </div>
                                            )}

                                            {requestedChangeData.guestNameChanges && (
                                                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                                                    <span className="text-blue-900 dark:text-blue-300 font-bold block mb-1">{t('taskManagement.drawer.reservationSummary.nameChange', 'İsim Değişikliği:')}</span>
                                                    <span className="text-slate-500 line-through mr-2">{requestedChangeData.guestNameChanges.oldName}</span>
                                                    <span className="text-emerald-600 font-bold">➔ {requestedChangeData.guestNameChanges.newName}</span>
                                                </div>
                                            )}

                                            {requestedChangeData.newOptionPreference && (
                                                <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs">
                                                    <span className="text-blue-900 dark:text-blue-300 font-bold block mb-1">{t('taskManagement.drawer.reservationSummary.preferenceUpgrade', 'Talep Edilen Tercih / Upgrade:')}</span>
                                                    <span className="text-blue-700 dark:text-blue-400 font-semibold">{requestedChangeData.newOptionPreference}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab 3: Attachments */}
                            {activeTab === 'attachments' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] dark:bg-[#18191c]">
                                    {(!task.attachments || task.attachments.length === 0) ? (
                                        <div className="text-center py-16 text-slate-400 text-xs">
                                            <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600 block mb-2">folder_off</span>
                                            {t('taskManagement.drawer.noAttachmentsYet', 'Bu talebe eklenmiş herhangi bir dosya bulunmamaktadır.')}
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {task.attachments.map(att => (
                                                <button
                                                    key={att.id}
                                                    type="button"
                                                    onClick={() => taskManagementService.downloadAttachment(att.id, att.fileOriginalName || att.fileName)}
                                                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#202124] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors group cursor-pointer text-xs shadow-2xs text-left"
                                                >
                                                    <div className="flex items-center gap-3 truncate">
                                                        <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-[20px]">description</span>
                                                        </div>
                                                        <div className="truncate">
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 block">
                                                                {att.fileOriginalName || att.fileName}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400">
                                                                {att.createdAt ? new Date(att.createdAt).toLocaleString() : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-600">download</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </aside>

            {/* Decision Confirmation Modal */}
            {showDecisionModal && (
                <div className="fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#202124] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${pendingApprovalState ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                <span className="material-symbols-outlined text-[24px]">
                                    {pendingApprovalState ? 'check_circle' : 'cancel'}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    {pendingApprovalState ? t('taskManagement.drawer.approveDiff', 'Fiyat Farkını Onayla') : t('taskManagement.drawer.rejectDiff', 'Fiyat Farkını Reddet')}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    +{productDetail?.priceDifference} {productDetail?.currency} tutarındaki fark için kararınız
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    {t('common.note', 'Açıklama / Notunuz (Opsiyonel)')}
                                </label>
                                <textarea
                                    value={decisionNote}
                                    onChange={(e) => setDecisionNote(e.target.value)}
                                    placeholder={t('taskManagement.drawer.typeMessagePlaceholder', 'Operasyon ekibine iletilecek not...')}
                                    rows={3}
                                    className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowDecisionModal(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                                >
                                    {t('common.cancel', 'Vazgeç')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingDecision}
                                    className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer ${
                                        pendingApprovalState
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {submittingDecision ? t('common.saving', 'Kaydediliyor...') : (pendingApprovalState ? t('taskManagement.statuses.APPROVED', 'Onayla') : t('taskManagement.statuses.REJECTED', 'Reddet'))}
                                </button>
                            </div>
                        </form>
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
                                title={t('common.download', 'İndir')}
                            >
                                <span className="material-symbols-outlined text-[17px]">download</span>
                                <span>{t('common.download', 'İndir')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewImage(null)}
                                className="p-1.5 rounded-xl bg-white/15 hover:bg-red-600 text-white transition-all cursor-pointer flex items-center justify-center"
                                title={t('common.close', 'Kapat')}
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
                    productType={task?.productType || 'HOTEL'}
                    onSuccess={(newTask) => {
                        setShowCreateModal(false);
                        if (onUpdated) onUpdated();
                        if (newTask?.id) {
                            navigate(`/task-management/${newTask.id}`);
                            onClose();
                        }
                    }}
                />
            )}
        </div>,
        document.body
    );
};

export default TaskDetailDrawer;

