import React, { useState, useEffect, useCallback } from 'react';
import { guestService } from '../services/guestService';

const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const CrmGuestSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const debouncedQuery = useDebounce(query, 500);
    const [guests, setGuests] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [initialData, setInitialData] = useState(null);
    const PAGE_SIZE = 8;

    const fetchGuests = useCallback(async (searchQuery, targetPage = 0) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await guestService.filterGuests({ query: searchQuery || null }, targetPage, PAGE_SIZE);
            if (response) {
                const content = response.guests || response.agencyCrmGuests || response.content || (Array.isArray(response) ? response : []);
                const data = {
                    content,
                    totalPages: response.totalPages || 0,
                    totalElements: response.totalElements || content.length,
                    page: targetPage
                };
                
                setGuests(content);
                setTotalPages(data.totalPages);
                setTotalElements(data.totalElements);
                setSelectedIndex(0);
                setPage(targetPage);

                // Cache initial data
                if (!searchQuery && targetPage === 0) {
                    setInitialData(data);
                }
            } else {
                setGuests([]);
                setTotalPages(0);
                setTotalElements(0);
            }
        } catch (err) {
            console.error('Failed to fetch CRM guests:', err);
            setError('Veri alınırken hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setPage(0);
            setSelectedIndex(0);
            
            if (initialData) {
                setGuests(initialData.content);
                setTotalPages(initialData.totalPages);
                setTotalElements(initialData.totalElements);
            } else {
                setGuests([]);
                fetchGuests('', 0);
            }
        } else {
            // Reset to initial state when closed so it's ready for next time
            setQuery('');
            if (initialData) {
                setGuests(initialData.content);
                setTotalPages(initialData.totalPages);
                setTotalElements(initialData.totalElements);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, fetchGuests]);

    useEffect(() => {
        if (isOpen && debouncedQuery !== undefined) {
            setPage(0);
            fetchGuests(debouncedQuery, 0);
        }
    }, [debouncedQuery, isOpen]); // removed fetchGuests to avoid unnecessary triggers if it changes

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen || guests.length === 0) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < guests.length - 1 ? prev + 1 : prev));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                onSelect(guests[selectedIndex]);
            } else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, guests, selectedIndex, onSelect, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex justify-center items-start pt-[5vh] sm:pt-[10vh] p-4 overflow-hidden">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            
            <div className="relative w-full max-w-5xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-4 duration-300">
                
                {/* Header & Search Area */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">groups</span>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">CRM Yolcu Listesi</h3>
                        </div>
                        <button onClick={onClose} className="size-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="İsim, soyisim, e-posta veya telefon ile hızlı ara..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-3 pl-12 pr-4 rounded-xl outline-none focus:border-primary transition-all font-medium text-sm text-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Table Header - Visible on desktop */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <div className="col-span-3">Yolcu Bilgisi</div>
                    <div className="col-span-2">Doğum Tarihi</div>
                    <div className="col-span-3">İletişim</div>
                    <div className="col-span-3">Pasaport</div>
                    <div className="col-span-1 text-right">İşlem</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg animate-pulse"></div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-20 text-center">
                            <p className="text-red-500 font-bold">{error}</p>
                        </div>
                    ) : guests.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 font-medium">Kayıt bulunamadı.</div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-white/5">
                            {guests.map((guest, index) => (
                                <div 
                                    key={guest.id} 
                                    onClick={() => onSelect(guest)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`group grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-6 py-3 cursor-pointer transition-all ${
                                        selectedIndex === index 
                                            ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-primary' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'
                                    }`}
                                >
                                    {/* Name Info */}
                                    <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${guest.gender === 'FEMALE' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                                            <span className="material-symbols-outlined text-base">{guest.gender === 'FEMALE' ? 'female' : 'male'}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate uppercase">
                                            {guest.firstName} {guest.lastName}
                                        </span>
                                    </div>

                                    {/* BirthDate */}
                                    <div className="col-span-1 md:col-span-2 text-xs font-bold text-slate-500 flex items-center gap-2">
                                        <span className="md:hidden text-[10px] uppercase text-slate-400 w-24">Doğum:</span>
                                        {guest.birthDate}
                                    </div>

                                    {/* Contact */}
                                    <div className="col-span-1 md:col-span-3 space-y-0.5">
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-slate-400">mail</span>
                                            {guest.email}
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-slate-400">phone</span>
                                            +{guest.phoneCountryCode} {guest.phoneNumber}
                                        </div>
                                    </div>

                                    {/* Passport */}
                                    <div className="col-span-1 md:col-span-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                                            {guest.passportNo || '—'}
                                        </div>
                                        {guest.passportExpiry && (
                                            <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                Exp: {guest.passportExpiry}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div className="col-span-1 md:col-span-1 text-right">
                                        <button className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedIndex === index ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            Seç
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with Keyboard Info & Pagination */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest order-2 sm:order-1">
                        <span className="flex items-center gap-1.5"><span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">↑↓</span> Gezin</span>
                        <span className="flex items-center gap-1.5"><span className="bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">ENTER</span> Seç</span>
                    </div>

                    <div className="flex items-center gap-3 order-1 sm:order-2">
                        <button 
                            disabled={page === 0 || isLoading}
                            onClick={() => fetchGuests(query, page - 1)}
                            className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_left</span>
                        </button>
                        
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md min-w-[32px] text-center">
                                {page + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">/</span>
                            <span className="text-[11px] font-bold text-slate-500">{totalPages || 1}</span>
                        </div>

                        <button 
                            disabled={page >= totalPages - 1 || isLoading}
                            onClick={() => fetchGuests(query, page + 1)}
                            className="size-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </button>

                        <div className="hidden md:block ml-4 text-[10px] font-black text-primary/60 uppercase tracking-widest">
                            {totalElements} Kayıt
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmGuestSelectionModal;
