import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CheckoutGuestDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedRooms, hotel, roomState } = location.state || {};

    const [activeRoomIdx, setActiveRoomIdx] = useState(0);

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

    if (!selectedRooms) return <div className="p-20 text-center">No rooms selected.</div>;

    const currentRoom = roomsData[activeRoomIdx];

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-['Inter',sans-serif]">
            <Header />
            <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                {/* Top Navigation / Breadcrumb */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all shadow-sm">
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Guest Details</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Booking • {hotel.name}</p>
                        </div>
                    </div>
                </div>

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
            </main>
            <Footer />
        </div>
    );
};

export default CheckoutGuestDetails;
