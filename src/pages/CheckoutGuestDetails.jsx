import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutGuestDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedRooms, hotel, roomState, checkInDate, checkOutDate } = location.state || {};

    // Calculate nights for accurate pricing
    const nights = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return 1;
        const start = new Date(checkInDate);
        const end = new Date(checkOutDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }, [checkInDate, checkOutDate]);

    const formattedDates = React.useMemo(() => {
        if (!checkInDate || !checkOutDate) return { start: 'Select Date', end: 'Select Date' };
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return {
            start: new Date(checkInDate).toLocaleDateString('en-US', options),
            end: new Date(checkOutDate).toLocaleDateString('en-US', options)
        };
    }, [checkInDate, checkOutDate]);

    const [activeRoomIdx, setActiveRoomIdx] = useState(0);

    // Auto-scroll to top on mount
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Initialize guest data for EVERY guest in EVERY room
    const [roomsData, setRoomsData] = useState(() => {
        if (!selectedRooms || !roomState) return [];
        return selectedRooms.map((room, roomIdx) => {
            const config = roomState[roomIdx] || { adults: 1, children: 0, childAges: [] };
            const guests = [];
            for (let i = 0; i < config.adults; i++) {
                guests.push({ type: 'Adult', firstName: '', lastName: '', email: '', phone: '', tcNo: '', passportNo: '', birthDate: '', gender: '', isNonTc: false });
            }
            for (let i = 0; i < config.children; i++) {
                guests.push({ type: 'Child', age: config.childAges[i], firstName: '', lastName: '', tcNo: '', passportNo: '', birthDate: '', gender: '', isNonTc: false });
            }
            return { roomName: room.name, guests };
        });
    });

    const [errors, setErrors] = useState({});

    const validateTcNo = (tc) => {
        if (!/^[1-9][0-9]{10}$/.test(tc)) return false;
        let sumOdd = 0, sumEven = 0;
        for (let i = 0; i < 9; i++) {
            if (i % 2 === 0) sumOdd += parseInt(tc[i]);
            else sumEven += parseInt(tc[i]);
        }
        let digit10 = (sumOdd * 7 - sumEven) % 10;
        if (digit10 < 0) digit10 += 10;
        if (parseInt(tc[9]) !== digit10) return false;
        if (parseInt(tc[10]) !== (sumOdd + sumEven + digit10) % 10) return false;
        return true;
    };

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleInputChange = (roomIdx, guestIdx, field, value) => {
        const newData = [...roomsData];
        newData[roomIdx].guests[guestIdx][field] = value;
        setRoomsData(newData);
    };

    const handleNext = () => {
        const currentRoom = roomsData[activeRoomIdx];
        const newErrors = { ...errors };
        let hasRoomError = false;

        currentRoom.guests.forEach((guest, gIdx) => {
            const key = `${activeRoomIdx}-${gIdx}`;
            const guestErrors = {
                firstName: !guest.firstName,
                lastName: !guest.lastName,
                email: guest.type === 'Adult' && gIdx === 0 && !validateEmail(guest.email),
                tcNo: !guest.isNonTc && !validateTcNo(guest.tcNo),
                passportNo: guest.isNonTc && !guest.passportNo,
                birthDate: !guest.birthDate,
                gender: !guest.gender
            };
            newErrors[key] = guestErrors;
            if (Object.values(guestErrors).some(v => v)) hasRoomError = true;
        });

        setErrors(newErrors);

        if (!hasRoomError) {
            if (activeRoomIdx < roomsData.length - 1) {
                setActiveRoomIdx(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                navigate('/hotel/checkout/payment', {
                    state: { ...location.state, roomsData }
                });
            }
        }
    };

    if (!selectedRooms) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center p-6 pt-32 pb-20">
                    <div className="w-full max-w-xl relative group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-[40px] blur-2xl opacity-100 transition-opacity duration-500"></div>

                        <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[40px] p-12 text-center shadow-2xl overflow-hidden">
                            {/* Decorative background icon */}
                            <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                                <span className="material-symbols-outlined text-[200px]">production_quantity_limits</span>
                            </div>

                            <div className="size-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-inner">
                                <span className="material-symbols-outlined text-5xl">shopping_cart_off</span>
                            </div>

                            <h2 className="text-3xl font-black uppercase tracking-tight mb-4 text-slate-900 dark:text-white">No Selection Found</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed max-w-sm mx-auto">
                                It looks like you haven't selected any rooms yet. Please return to the hotel details to choose your preferred accommodation.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Back to Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/hotels')}
                                    className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
                                >
                                    Browse Hotels
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const currentRoom = roomsData[activeRoomIdx];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-['Inter',sans-serif]">
            <Header />
            <main className="max-w-6xl mx-auto px-6 pt-24 pb-20">
                {/* Top Navigation / Breadcrumb */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all shadow-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">Guest Details</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Booking • {hotel.name}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                    <div className="lg:col-span-2">
                        {/* Room Stepper */}
                        <div className="flex gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar">
                            {roomsData.map((room, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => idx < activeRoomIdx && setActiveRoomIdx(idx)}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all shrink-0 ${idx === activeRoomIdx ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : idx < activeRoomIdx ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/40 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'}`}
                                >
                                    <span className="material-symbols-outlined text-[18px]">{idx < activeRoomIdx ? 'check_circle' : 'bed'}</span>
                                    <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">Room {idx + 1}</span>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500" key={activeRoomIdx}>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight">{currentRoom.roomName}</h2>
                                <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">Occupancy Info</span>
                            </div>

                            {currentRoom.guests.map((guest, gIdx) => (
                                <div key={gIdx} className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl">
                                        <div className="flex items-center justify-between mb-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${guest.type === 'Adult' ? 'bg-slate-100 dark:bg-slate-800 text-primary' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    <span className="material-symbols-outlined text-2xl">{guest.type === 'Adult' ? 'person' : 'child_care'}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight">{gIdx === 0 && guest.type === 'Adult' ? 'Lead Guest (Contact)' : `${guest.type} Traveler ${gIdx + 1}`}</h3>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{guest.type === 'Adult' ? 'Standard Adult Policy' : `Child Passenger • Age ${guest.age}`}</p>
                                                </div>
                                            </div>
                                            {guest.type === 'Adult' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleInputChange(activeRoomIdx, gIdx, 'isNonTc', !guest.isNonTc)}
                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${guest.isNonTc ? 'bg-primary/10 border-primary text-primary' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400'}`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Non-TC Citizen</span>
                                                    <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${guest.isNonTc ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                        {guest.isNonTc && <span className="material-symbols-outlined text-[14px]">check</span>}
                                                    </div>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                                                <input required className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.firstName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`} placeholder="Enter first name" value={guest.firstName} onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'firstName', e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                                                <input required className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.lastName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`} placeholder="Enter last name" value={guest.lastName} onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'lastName', e.target.value)} />
                                            </div>

                                            {/* Birth Date and Gender */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Birth Date</label>
                                                <input
                                                    type="date"
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.birthDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase`}
                                                    value={guest.birthDate}
                                                    onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'birthDate', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                                                <div className={`grid grid-cols-2 gap-3 p-1 rounded-2xl border ${errors[`${activeRoomIdx}-${gIdx}`]?.gender ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800`}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange(activeRoomIdx, gIdx, 'gender', 'male')}
                                                        className={`flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${guest.gender === 'male' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">male</span> Male
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleInputChange(activeRoomIdx, gIdx, 'gender', 'female')}
                                                        className={`flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${guest.gender === 'female' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">female</span> Female
                                                    </button>
                                                </div>
                                            </div>

                                            {gIdx === 0 && guest.type === 'Adult' && (
                                                <>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                                                        <input required type="email" className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`} placeholder="email@example.com" value={guest.email} onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'email', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                                        <input required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" placeholder="+90 (___) ___ ____" value={guest.phone} onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'phone', e.target.value)} />
                                                    </div>
                                                </>
                                            )}

                                            <div className="space-y-2 md:col-span-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">
                                                    {guest.isNonTc ? 'Passport Number' : 'Local Identity ID (T.C.)'}
                                                </label>
                                                {guest.isNonTc ? (
                                                    <input
                                                        className={`w-full p-5 rounded-2xl outline-none transition-all font-black tracking-[0.25em] bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.passportNo ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700'} focus:ring-2 focus:ring-primary/20`}
                                                        placeholder="ENTER PASSPORT NUMBER"
                                                        value={guest.passportNo}
                                                        onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'passportNo', e.target.value.toUpperCase())}
                                                    />
                                                ) : (
                                                    <input
                                                        maxLength={11}
                                                        className={`w-full p-5 rounded-2xl outline-none transition-all font-black tracking-[0.25em] bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.tcNo ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-slate-200 dark:border-slate-700'} focus:ring-2 focus:ring-primary/20`}
                                                        placeholder="11-DIGIT IDENTITY NO"
                                                        value={guest.tcNo}
                                                        onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'tcNo', e.target.value.replace(/\D/g, ''))}
                                                    />
                                                )}
                                                {!guest.isNonTc && errors[`${activeRoomIdx}-${gIdx}`]?.tcNo && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-2 ml-1 animate-in fade-in duration-300">Invalid Turkish Identity Verification</p>}
                                                {guest.isNonTc && errors[`${activeRoomIdx}-${gIdx}`]?.passportNo && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-2 ml-1 animate-in fade-in duration-300">Passport Number is required</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="pt-10 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => activeRoomIdx > 0 ? setActiveRoomIdx(prev => prev - 1) : navigate(-1)}
                                    className="px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-3"
                                >
                                    <span className="material-symbols-outlined text-[18px]">keyboard_backspace</span>
                                    {activeRoomIdx > 0 ? `Back to Room ${activeRoomIdx}` : 'Back to Selection'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="px-12 py-5 bg-primary text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                                >
                                    {activeRoomIdx < roomsData.length - 1 ? (
                                        <>Next: Room {activeRoomIdx + 2} <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                                    ) : (
                                        <>Review & Pay <span className="material-symbols-outlined text-[18px]">credit_score</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sticky Reservation Summary Sidebar */}
                    <div className="lg:sticky lg:top-24 space-y-8">
                        <div className="p-8 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <span className="material-symbols-outlined text-[120px]">assignment</span>
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-xl font-black uppercase mb-8 tracking-tight flex items-center gap-3">
                                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined text-xl">receipt_long</span>
                                    </div>
                                    Reservation Summary
                                </h2>

                                {/* Hotel Quick Info */}
                                <div className="flex gap-4 mb-8 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                                    <div className="size-20 rounded-2xl overflow-hidden shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                                        <img src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt={hotel.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="flex items-center gap-1 mb-1">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={`material-symbols-outlined text-[12px] ${i < (hotel.stars || 5) ? 'text-amber-400 fill-1' : 'text-slate-300'}`}>star</span>
                                            ))}
                                        </div>
                                        <h3 className="font-black text-sm uppercase tracking-tight leading-tight mb-1 line-clamp-2">{hotel.name}</h3>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{hotel.location}</p>
                                    </div>
                                </div>

                                {/* Booking Dates */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-in</p>
                                        <p className="text-sm font-black uppercase text-primary">{formattedDates.start}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-out</p>
                                        <p className="text-sm font-black uppercase text-primary">{formattedDates.end}</p>
                                    </div>
                                </div>

                                {/* Room Breakdown */}
                                <div className="space-y-4 mb-8 pb-8 border-b border-dashed border-slate-200 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selected Rooms</p>
                                    {selectedRooms?.map((room, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-xs group/room">
                                            <div className="flex gap-3">
                                                <div className="size-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/room:bg-primary/10 group-hover/room:text-primary transition-colors">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase tracking-tight mb-0.5">{room.name}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{roomState[idx]?.adults} Adults, {roomState[idx]?.children} Children</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-slate-700 dark:text-slate-300">${(room.rate * nights).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Total */}
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-primary tracking-tighter leading-none">${(selectedRooms.reduce((sum, r) => sum + r.rate, 0) * nights).toFixed(2)}</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Taxes Included • {nights} Night{nights > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="p-6 rounded-[32px] border border-emerald-500/10 bg-emerald-500/5 backdrop-blur-3xl flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <span className="material-symbols-outlined font-black">verified_user</span>
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight dark:text-emerald-400">Secure Checkout</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">256-bit SSL encrypted connection</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutGuestDetails;
