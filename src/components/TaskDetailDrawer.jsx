import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taskManagementService } from '../services/taskManagementService';

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

const TaskDetailDrawer = ({ taskId, isOpen, onClose, onUpdated }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'details' | 'attachments'

    // Chat compose state
    const [messageText, setMessageText] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [sending, setSending] = useState(false);

    // Decision state
    const [decisionNote, setDecisionNote] = useState('');
    const [submittingDecision, setSubmittingDecision] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [pendingApprovalState, setPendingApprovalState] = useState(null);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const prevMessagesLengthRef = useRef(0);

    useEffect(() => {
        if (isOpen && taskId) {
            fetchDetail();
        } else {
            setTask(null);
            setMessageText('');
            setSelectedFiles([]);
            setActiveTab('chat');
            prevMessagesLengthRef.current = 0;
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
            await fetchDetail(true);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'chat' && chatContainerRef.current) {
            const currentLength = task?.messages?.length || 0;
            if (currentLength > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0) {
                // Smooth scroll only when a new message is added while already viewing the chat
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                // Instant jump to bottom on tab switch or initial render without animation
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
            prevMessagesLengthRef.current = currentLength;
        }
    }, [task?.messages, activeTab]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const text = messageText.trim();
        const files = [...selectedFiles];
        if (!text && files.length === 0) return;

        // Clear input immediately for snappy messaging feel
        setMessageText('');
        setSelectedFiles([]);

        try {
            setSending(true);

            // 1. Send text message
            if (text) {
                await taskManagementService.addMessage(taskId, {
                    message: text,
                    messageType: 'TEXT',
                    senderName: 'Acente Yetkilisi'
                });
            }

            // 2. Upload files if any
            if (files.length > 0) {
                for (const f of files) {
                    await taskManagementService.uploadAttachment(taskId, f);
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
            await taskManagementService.respondPriceConfirmation(taskId, {
                approved: pendingApprovalState,
                note: decisionNote
            });
            setShowDecisionModal(false);
            setDecisionNote('');
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

    if (!isOpen) return null;

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

    return createPortal(
        <div className="fixed inset-0 z-[99999] overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
                onClick={onClose}
            />

            {/* Slide-over Panel */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
                <div className="w-screen max-w-2xl bg-white dark:bg-[#202124] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col font-roboto animate-in slide-in-from-right duration-300">
                    
                    {/* Drawer Header */}
                    <div className="px-6 py-4 bg-slate-50 dark:bg-[#28292c] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                <span className="material-symbols-outlined text-[24px]">{productIcon}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                        Talep #{task?.taskNumber || taskId}
                                    </h2>
                                    {task && (
                                        <>
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${status.bg}`}>
                                                {status.label}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${priority.color}`}>
                                                {priority.label}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {task?.productType} • Rez: #{task?.reservationNo || '-'} • {task?.createdAt ? new Date(task.createdAt).toLocaleString('tr-TR') : '-'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => navigate(`/task-management/${taskId}`)}
                                title="Tam Sayfada Aç"
                                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </button>
                            <button
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                                title="Yenile"
                                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                            </button>
                            <button
                                onClick={onClose}
                                title="Kapat"
                                className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    </div>

                    {loading || !task ? (
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
                                                <h4 className="font-bold text-xs">Fiyat Farkı Onayı Bekleniyor</h4>
                                                <p className="text-[11px] text-amber-100">Operasyon ekibi fiyat farkı bildirdi</p>
                                            </div>
                                        </div>
                                        <span className="text-base font-black bg-white/20 px-2.5 py-0.5 rounded-lg">
                                            +{productDetail.priceDifference} {productDetail.currency || 'EUR'}
                                        </span>
                                    </div>
                                    {productDetail.confirmationNote && (
                                        <div className="p-2 bg-white/10 rounded-lg text-[11px] backdrop-blur-xs">
                                            <strong>Not:</strong> {productDetail.confirmationNote}
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
                                            <span>Farkı Reddet</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPendingApprovalState(true);
                                                setShowDecisionModal(true);
                                            }}
                                            className="py-1.5 px-3 rounded-lg bg-white text-orange-600 hover:bg-orange-50 text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                            <span>Farkı Onayla</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {productDetail?.confirmationStatus === 'CONFIRMED' && (
                                <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 shrink-0">
                                    <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                                    <span>Fiyat farkı (<strong>+{productDetail.priceDifference} {productDetail.currency}</strong>) onaylandı.</span>
                                </div>
                            )}

                            {productDetail?.confirmationStatus === 'REJECTED' && (
                                <div className="px-6 py-2.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 shrink-0">
                                    <span className="material-symbols-outlined text-rose-600 text-[18px]">cancel</span>
                                    <span>Fiyat farkı tarafınızca reddedildi.</span>
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
                                    <span>Mesajlaşma Akışı</span>
                                    <span className="size-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] flex items-center justify-center font-bold">
                                        {task.messages?.length || 0}
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
                                    <span>Rezervasyon & Talep</span>
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
                                    <span>Dosya Ekleri ({task.attachments?.length || 0})</span>
                                </button>
                            </div>

                            {/* Tab 1: Chat Timeline */}
                            {activeTab === 'chat' && (
                                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1c1c1e]">
                                    <div 
                                        ref={chatContainerRef}
                                        className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-[#1c1c1e]"
                                        style={{ '--chat-bg': '#ffffff', '--chat-bg-dark': '#1c1c1e' }}
                                    >
                                        {(!task.messages || task.messages.length === 0) ? (
                                            <div className="text-center py-12 text-slate-400 text-xs">
                                                <span className="material-symbols-outlined text-[32px] text-slate-300 block mb-1">chat</span>
                                                Henüz mesaj kaydı bulunmuyor.
                                            </div>
                                        ) : (
                                            task.messages.map((msg) => {
                                                const isAgency = msg.senderType === 'AGENCY_USER';
                                                const isSystem = msg.messageType === 'STATUS_CHANGE' || msg.messageType === 'SYSTEM';
                                                const isPriceOffer = msg.messageType === 'PRICE_OFFER';

                                                if (isSystem) {
                                                    return (
                                                        <div key={msg.id} className="flex items-center justify-center my-2">
                                                            <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
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
                                                                <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                                                            </div>
                                                        ) : isAgency ? (
                                                            <div className="flex flex-col items-end max-w-[85%] sm:max-w-[75%]">
                                                                <div className="imessage-bubble from-me">
                                                                    <div className="whitespace-pre-wrap select-text leading-relaxed break-normal">
                                                                        {msg.message}
                                                                    </div>

                                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                                        <div className="mt-2 pt-2 border-t border-white/25 space-y-1.5">
                                                                            {msg.attachments.map(a => (
                                                                                <a
                                                                                    key={a.id}
                                                                                    href={taskManagementService.getAttachmentDownloadUrl(a.id)}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[12px] font-medium transition-colors cursor-pointer border border-white/20"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">description</span>
                                                                                    <span className="truncate flex-1">{a.fileOriginalName || a.fileName}</span>
                                                                                    <span className="material-symbols-outlined text-[14px] opacity-80">download</span>
                                                                                </a>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                                                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%]">
                                                                <span className="text-[11px] text-slate-400 font-semibold mb-1 px-1">
                                                                    {msg.senderName || 'TOG Operasyon'}
                                                                </span>
                                                                <div className="imessage-bubble from-them">
                                                                    <div className="whitespace-pre-wrap select-text leading-relaxed break-normal">
                                                                        {msg.message}
                                                                    </div>

                                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                                        <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 space-y-1.5">
                                                                            {msg.attachments.map(a => (
                                                                                <a
                                                                                    key={a.id}
                                                                                    href={taskManagementService.getAttachmentDownloadUrl(a.id)}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="flex items-center gap-2 p-1.5 px-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-[#3A3A3C] text-blue-600 dark:text-blue-400 text-[12px] font-medium transition-colors cursor-pointer border border-slate-200/60 dark:border-white/10 shadow-xs"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-[16px]">description</span>
                                                                                    <span className="truncate flex-1 text-slate-800 dark:text-slate-200">{a.fileOriginalName || a.fileName}</span>
                                                                                    <span className="material-symbols-outlined text-[14px]">download</span>
                                                                                </a>
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

                                    {/* Message Composer Footer */}
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
                                                title="Dosya / Belge Ekle"
                                                className="size-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">attach_file</span>
                                            </button>

                                            <input
                                                type="text"
                                                value={messageText}
                                                onChange={(e) => setMessageText(e.target.value)}
                                                placeholder="Operasyon ekibine mesaj yazın..."
                                                className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#28292c] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                                            />

                                            <button
                                                type="button"
                                                onClick={handleManualRefresh}
                                                disabled={refreshing}
                                                title="Akışı Yenile"
                                                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-[#28292c] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                                            >
                                                <span className={`material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300 ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
                                                <span className="hidden sm:inline">Yenile</span>
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
                                                        <span>Gönder</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Tab 2: Reservation & Request Details */}
                            {activeTab === 'details' && (
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fa] dark:bg-[#18191c]">
                                    
                                    {/* 1. Reservation Card */}
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

                                    {/* 2. Request Details */}
                                    <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xs">
                                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Talep Bilgileri</span>
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                                                {task.taskTypeName || task.taskTypeCode}
                                            </span>
                                        </div>

                                        <div className="space-y-3 text-xs">
                                            <div>
                                                <span className="text-slate-400 block text-[11px] mb-1">İlk Talep Açıklaması:</span>
                                                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#28292c] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                                    {task.description}
                                                </div>
                                            </div>

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
                                </div>
                            )}

                            {/* Tab 3: Attachments */}
                            {activeTab === 'attachments' && (
                                <div className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] dark:bg-[#18191c]">
                                    {(!task.attachments || task.attachments.length === 0) ? (
                                        <div className="text-center py-16 text-slate-400 text-xs">
                                            <span className="material-symbols-outlined text-[36px] text-slate-300 dark:text-slate-600 block mb-2">folder_off</span>
                                            Bu talebe eklenmiş herhangi bir dosya bulunmamaktadır.
                                        </div>
                                    ) : (
                                        <div className="space-y-2.5">
                                            {task.attachments.map(att => (
                                                <a
                                                    key={att.id}
                                                    href={taskManagementService.getAttachmentDownloadUrl(att.id)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-[#202124] hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 transition-colors group cursor-pointer text-xs shadow-2xs"
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
                                                                {att.createdAt ? new Date(att.createdAt).toLocaleString('tr-TR') : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-blue-600">download</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

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
                                    {pendingApprovalState ? 'Fiyat Farkını Onayla' : 'Fiyat Farkını Reddet'}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    +{productDetail?.priceDifference} {productDetail?.currency} tutarındaki fark için kararınız
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleDecisionSubmit} className="space-y-4 pt-2">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Açıklama / Notunuz (Opsiyonel)
                                </label>
                                <textarea
                                    value={decisionNote}
                                    onChange={(e) => setDecisionNote(e.target.value)}
                                    placeholder="Operasyon ekibine iletilecek not..."
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
                                    Vazgeç
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
                                    {submittingDecision ? 'Kaydediliyor...' : (pendingApprovalState ? 'Onayla' : 'Reddet')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

export default TaskDetailDrawer;
