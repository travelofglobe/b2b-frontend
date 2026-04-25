import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
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
                guests.push({ type: 'Adult', firstName: '', lastName: '', email: '', phone: '', birthDate: '', gender: '' });
            }
            for (let i = 0; i < config.children; i++) {
                guests.push({ type: 'Child', age: config.childAges[i], firstName: '', lastName: '', birthDate: '', gender: '' });
            }
            return { roomName: room.name, guests, cancellationPolicies: room.cancellationPolicies || [], hubRateModel: room.hubRateModel };
        });
    });

    const [clientReferenceId, setClientReferenceId] = useState('');
    const [remark, setRemark] = useState('');

    const [errors, setErrors] = useState({});



    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const getCurrencySymbol = (code) => {
        const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'TRY': '₺', 'AED': 'د.إ', 'SAR': 'ر.س', 'JPY': '¥', 'CHF': 'Fr', 'CAD': 'CA$', 'AUD': 'A$' };
        return symbols[code] || code || '$';
    };

    const handleInputChange = (roomIdx, guestIdx, field, value) => {
        const newData = [...roomsData];
        newData[roomIdx].guests[guestIdx][field] = value;
        setRoomsData(newData);
    };

    // Birth date validation: must be a valid date, not in the future, year must be 4 digits
    const validateBirthDate = (dateStr) => {
        if (!dateStr) return false;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return false;
        const year = date.getFullYear();
        if (year < 1900 || year > new Date().getFullYear()) return false;
        return date <= new Date();
    };

    const handleNext = () => {
        const currentRoom = roomsData[activeRoomIdx];
        const newErrors = { ...errors };
        let hasRoomError = false;
        let firstErrorField = null;

        currentRoom.guests.forEach((guest, gIdx) => {
            const key = `${activeRoomIdx}-${gIdx}`;
            const guestErrors = {
                firstName: !guest.firstName,
                lastName: !guest.lastName,
                email: guest.type === 'Adult' && gIdx === 0 && !validateEmail(guest.email),
                birthDate: !validateBirthDate(guest.birthDate),
                gender: !guest.gender
            };
            newErrors[key] = guestErrors;
            if (Object.values(guestErrors).some(v => v)) {
                hasRoomError = true;
                // Track first error field for scroll
                if (!firstErrorField) {
                    const fieldName = Object.keys(guestErrors).find(k => guestErrors[k]);
                    firstErrorField = { key, field: fieldName, gIdx };
                }
            }
        });

        setErrors(newErrors);

        if (hasRoomError) {
            // Scroll to first invalid field after state update
            setTimeout(() => {
                const selector = firstErrorField
                    ? `[data-field="${firstErrorField.key}-${firstErrorField.field}"]`
                    : '[data-error="true"]';
                const el = document.querySelector(selector);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.focus?.();
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 50);
        } else {
            if (activeRoomIdx < roomsData.length - 1) {
                setActiveRoomIdx(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                navigate('/hotel/checkout/payment', {
                    state: { ...location.state, roomsData, clientReferenceId, remark }
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

    const hotelName = hotel.names?.tr || hotel.names?.en || hotel.name || 'Hotel';
    const hotelStars = hotel.hotelStar?.star || hotel.stars || 5;
    const hotelAddress = hotel.address ? `${hotel.address.street || ''}, ${hotel.address.cityName || ''}`.replace(/^,\s*/, '').replace(/,\s*$/, '') : (hotel.location || '');
    const hotelImage = hotel.images?.[0]?.url || hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    const grandTotal = selectedRooms.reduce((sum, r) => sum + r.rate, 0) * nights;
    const displayCurrency = selectedRooms[0]?.currency || '$';

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-['Inter',sans-serif]">
            <Header />
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-20">
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-8">
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
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                                                <input
                                                    data-field={`${activeRoomIdx}-${gIdx}-firstName`}
                                                    required
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.firstName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`}
                                                    placeholder="Enter first name"
                                                    value={guest.firstName}
                                                    onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'firstName', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                                                <input
                                                    data-field={`${activeRoomIdx}-${gIdx}-lastName`}
                                                    required
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.lastName ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`}
                                                    placeholder="Enter last name"
                                                    value={guest.lastName}
                                                    onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'lastName', e.target.value)}
                                                />
                                            </div>

                                            {/* Birth Date and Gender */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Birth Date</label>
                                                <input
                                                    data-field={`${activeRoomIdx}-${gIdx}-birthDate`}
                                                    type="date"
                                                    className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.birthDate ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase`}
                                                    value={guest.birthDate}
                                                    min="1900-01-01"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => {
                                                        handleInputChange(activeRoomIdx, gIdx, 'birthDate', e.target.value);
                                                    }}
                                                    onBlur={(e) => {
                                                        const val = e.target.value;
                                                        if (val) {
                                                            const year = parseInt(val.split('-')[0], 10);
                                                            if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
                                                                handleInputChange(activeRoomIdx, gIdx, 'birthDate', '');
                                                            }
                                                        }
                                                    }}
                                                />
                                                {errors[`${activeRoomIdx}-${gIdx}`]?.birthDate && <p className="text-red-500 text-[10px] font-black uppercase tracking-wider mt-1 ml-1 animate-in fade-in duration-300">Please enter a valid birth date</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</label>
                                                <div
                                                    data-field={`${activeRoomIdx}-${gIdx}-gender`}
                                                    className={`grid grid-cols-2 gap-3 p-1 rounded-2xl border ${errors[`${activeRoomIdx}-${gIdx}`]?.gender ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-slate-50 dark:bg-slate-800`}>
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
                                                        <input
                                                            data-field={`${activeRoomIdx}-${gIdx}-email`}
                                                            required
                                                            type="email"
                                                            className={`w-full bg-slate-50 dark:bg-slate-800 border ${errors[`${activeRoomIdx}-${gIdx}`]?.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`}
                                                            placeholder="email@example.com"
                                                            value={guest.email}
                                                            onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'email', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                                        <input required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold" placeholder="+___ ___ ___ ____" value={guest.phone} onChange={(e) => handleInputChange(activeRoomIdx, gIdx, 'phone', e.target.value)} />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Booking Reference & Remark Section - Added for Book Service */}
                            {activeRoomIdx === roomsData.length - 1 && (
                                <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="relative p-10 rounded-[40px] border border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl shadow-2xl">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-2xl">receipt_long</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black uppercase tracking-tight">Booking References</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal identifiers & special requests</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Reference ID</label>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                                    placeholder="Your internal reference number"
                                                    value={clientReferenceId}
                                                    onChange={(e) => setClientReferenceId(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Special Remarks</label>
                                                <input
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                                    placeholder="Any special requests or notes"
                                                    value={remark}
                                                    onChange={(e) => setRemark(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                        <div className="relative group/sidebar">
                            {/* Glass Background */}
                            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[40px] border border-white/40 dark:border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] transition-all duration-500 group-hover/sidebar:shadow-[0_48px_96px_-16px_rgba(0,0,0,0.15)]"></div>

                            <div className="relative p-8 z-10">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.07] pointer-events-none group-hover/sidebar:scale-110 transition-transform duration-700">
                                    <span className="material-symbols-outlined text-[140px]">hotel_class</span>
                                </div>

                                {/* Header */}
                                <div className="flex items-center gap-2 text-primary font-black text-[10px] mb-6 uppercase tracking-[0.2em] bg-primary/5 dark:bg-primary/20 p-3 rounded-2xl border border-primary/10">
                                    <span className="material-symbols-outlined text-sm fill-1">bolt</span>
                                    Instant Confirmation Available
                                </div>

                                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                    Reservation Summary
                                </h3>

                                {/* Hotel Info Card */}
                                <div className="mb-6 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="relative h-32 overflow-hidden">
                                        <img
                                            src={hotelImage}
                                            alt={hotelName}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <div className="flex items-center gap-0.5 mb-1">
                                                {[...Array(hotelStars)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-[11px] text-amber-400 fill-1">star</span>
                                                ))}
                                            </div>
                                            <h3 className="font-black text-white text-sm uppercase tracking-tight leading-tight line-clamp-1">{hotelName}</h3>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                                        {hotelAddress && (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[13px] text-primary shrink-0">location_on</span>
                                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">{hotelAddress}</p>
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[11px] text-primary">login</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">In: {hotel.checkIn || '15:00'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[11px] text-primary">logout</span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Out: {hotel.checkOut || '11:00'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Booking Dates */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-in</p>
                                        <p className="text-sm font-black uppercase text-primary leading-tight">{formattedDates.start}</p>
                                    </div>
                                    <div className="p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Check-out</p>
                                        <p className="text-sm font-black uppercase text-primary leading-tight">{formattedDates.end}</p>
                                    </div>
                                    <div className="col-span-2 p-3.5 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[13px] text-primary">nights_stay</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{nights} Night{nights > 1 ? 's' : ''} Stay</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[13px] text-primary">group</span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {roomState.reduce((s, r) => s + r.adults, 0)} Adults{roomState.reduce((s, r) => s + r.children, 0) > 0 ? `, ${roomState.reduce((s, r) => s + r.children, 0)} Children` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Room Breakdown */}
                                <div className="space-y-4 mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Rooms</p>
                                    {selectedRooms?.map((room, idx) => {
                                        const policies = room.cancellationPolicies || [];
                                        return (
                                            <div key={idx} className="relative p-4 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/5 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="size-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary shrink-0 mt-0.5">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-[11px] uppercase tracking-tight text-slate-900 dark:text-white line-clamp-2">{room.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{roomState[idx]?.adults} Adults{roomState[idx]?.children > 0 ? `, ${roomState[idx].children} Children` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <div className="flex items-baseline justify-end gap-1">
                                                            <span className="text-base font-black text-primary leading-none">{getCurrencySymbol(room.currency)}</span>
                                                            <span className="font-black text-sm text-primary leading-none">{(room.rate * nights).toFixed(2)}</span>
                                                        </div>
                                                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{room.currency || '$'} · {nights} Night{nights > 1 ? 's' : ''}</p>
                                                    </div>
                                                </div>
                                                {/* Cancellation policy */}
                                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                    {policies.length > 0 ? (
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Cancellation Policy</p>
                                                            {policies.map((policy, pIdx) => (
                                                                <div key={pIdx} className="flex justify-between items-center">
                                                                    <span className="text-[9px] font-bold text-slate-500">
                                                                        {policy.fromDate ? new Date(policy.fromDate.split('[')[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                                    </span>
                                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                                                        policy.amount === 0
                                                                            ? 'bg-emerald-500/10 text-emerald-500'
                                                                            : 'bg-orange-500/10 text-orange-500'
                                                                    }`}>
                                                                        {policy.amount === 0 ? 'Free Cancel' : `${policy.currency || ''} ${policy.amount}`}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[10px]">info</span>
                                                            Standard cancellation applies
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Grand Total */}
                                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mb-6">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Total Stay Price (Net)</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-primary leading-none">{getCurrencySymbol(displayCurrency)}</span>
                                                <p className="text-4xl font-black text-primary leading-none tracking-tighter">
                                                    {grandTotal.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{displayCurrency} · Taxes Incl. · {nights} Night{nights > 1 ? 's' : ''}</p>
                                        </div>
                                        <div className="size-10 rounded-2xl flex items-center justify-center text-primary bg-primary/10 border border-primary/20">
                                            <span className="material-symbols-outlined">payments</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">
                                    B2B AGENCY RATES APPLIED
                                </p>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm">
                                <span className="material-symbols-outlined">verified_user</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SECURE PAYMENT</p>
                                <p className="text-sm font-black">TOG Protected Booking</p>
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
