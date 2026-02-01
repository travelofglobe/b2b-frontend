import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { mockHotels } from '../data/mockHotels';

const BookingConfirmationModal = ({ isOpen, onClose, hotelName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-10 shadow-2xl animate-in fade-in zoom-in duration-300 text-center border border-white/20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>
                <div className="size-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 ring-8 ring-emerald-50/50 dark:ring-emerald-900/10">
                    <span className="material-symbols-outlined text-5xl animate-bounce-slow">check_circle</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Booking Confirmed!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                    Great choice! Your reservation at <br /> <span className="text-slate-900 dark:text-white font-black">{hotelName}</span> <br /> has been successfully secured.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Download Voucher
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const HotelDetail = () => {
    const { id, slug } = useParams();
    // Use slug or id to fetch hotel. Ideally if slug is present, fetch by slug.
    // For now we assume the ID is passed or mock logic for slug.
    console.log('Hotel Params:', { id, slug });
    const isMock = true; // Simulating fetch behavior
    const navigate = useNavigate();
    const hotel = mockHotels.find(h => h.id === parseInt(id)) || mockHotels[0];
    const images = hotel.images || [hotel.image];
    const [activeTab, setActiveTab] = React.useState('Rooms & Rates');
    const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);

    const tabs = ['Rooms & Rates', 'Overview', 'Amenities', 'Policies', 'Reviews'];

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200 font-sans">
            <Header />

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Breadcrumbs />
                    <Link to="/" className="flex items-center gap-1.5 text-sm font-bold text-primary group">
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Search
                    </Link>
                </div>

                {/* Hotel Title & Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black tracking-tight">{hotel.name}</h1>
                            <div className="flex text-amber-400">
                                {[...Array(5)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined fill-1 text-lg">star</span>
                                ))}
                            </div>
                            <span className="bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm border border-emerald-200/20">
                                <span className="material-symbols-outlined text-xs">verified</span> VERIFIED
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                            <span className="font-semibold text-sm">{hotel.location}</span>
                            <button
                                onClick={() => navigate(`/map?hotelId=${hotel.id}`)}
                                className="text-primary text-sm font-bold hover:underline ml-2">
                                Show on Map
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{hotel.ratingLabel}</span>
                            <span className="text-xs text-slate-500 font-bold mt-1">1,240 reviews</span>
                            <span className="text-[10px] text-primary font-black flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                <span className="material-symbols-outlined text-xs fill-1">trending_up</span> Highly Popular
                            </span>
                        </div>
                        <div className="bg-primary text-white w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black shadow-lg shadow-primary/20">
                            <span className="text-2xl leading-none">{hotel.rating}</span>
                            <span className="text-[10px] opacity-70">/10</span>
                        </div>
                    </div>
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {['Free WiFi', 'Free Parking', 'Breakfast Available', 'Pool', 'Sea View'].map((item, i) => (
                        <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all cursor-default backdrop-blur-md shadow-sm">
                            <span className="material-symbols-outlined text-sm text-primary">check_circle</span> {item}
                        </span>
                    ))}
                </div>

                {/* Benton Grid Gallery */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-3 h-[540px] mb-8 overflow-hidden rounded-[32px] relative group/gallery">
                    <div className="md:col-span-2 md:row-span-2 relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[0]} alt={hotel.name} />
                        <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black shadow-2xl border border-white/20">
                            1 / {images.length} Photos
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10">
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[1] || images[0]} alt="" />
                        <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover/gallery:translate-y-0 group-hover/gallery:opacity-100 transition-all duration-500">
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-xl">favorite</span></button>
                            <button className="size-9 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md flex items-center justify-center text-slate-800 dark:text-white shadow-xl hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">share</span></button>
                        </div>
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10">
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[2] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10">
                        <img className="w-full h-full object-cover transition-all duration-700 hover:scale-105" src={images[1] || images[0]} alt="" />
                    </div>
                    <div className="hidden md:block relative overflow-hidden ring-1 ring-white/10 group/viewall cursor-pointer">
                        <img className="w-full h-full object-cover group-hover/viewall:scale-110 blur-[2px] transition-all duration-700" src={images[0]} alt="" />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center p-4">
                            <span className="material-symbols-outlined text-4xl mb-2 animate-bounce-slow">photo_library</span>
                            <span className="text-sm font-black uppercase tracking-widest">Show All Photos</span>
                        </div>
                    </div>
                </div>

                {/* Quick Selection Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-[24px] shadow-xl shadow-slate-200/50 dark:shadow-none grid grid-cols-1 md:grid-cols-12 gap-3 mb-8">
                    <div className="md:col-span-4 relative">
                        <label className="absolute left-10 top-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400">Location</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-5 rounded-xl">
                            <span className="material-symbols-outlined text-primary">location_on</span>
                            <input className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 w-full text-slate-900 dark:text-white" type="text" value={hotel.location} readOnly />
                        </div>
                    </div>
                    <div className="md:col-span-3 relative">
                        <label className="absolute left-10 top-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400">Check-in / Out</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-5 rounded-xl">
                            <span className="material-symbols-outlined text-primary">calendar_month</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black">10.10.2025 - 12.10.2025</span>
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded">2n</span>
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-2 relative">
                        <label className="absolute left-10 top-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400">Guests</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-5 rounded-xl">
                            <span className="material-symbols-outlined text-primary">group</span>
                            <span className="text-sm font-black">2 Adults, 1 Room</span>
                        </div>
                    </div>
                    <div className="md:col-span-2 relative">
                        <label className="absolute left-10 top-2.5 text-[10px] uppercase tracking-wider font-bold text-slate-400">Nationality</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-5 rounded-xl">
                            <span className="text-sm">🇩🇪</span>
                            <select className="bg-transparent border-none p-0 text-sm font-black focus:ring-0 w-full text-slate-900 dark:text-white appearance-none cursor-pointer">
                                <option>Germany</option>
                                <option>USA</option>
                                <option>UAE</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-1">
                        <button className="w-full h-full bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8">
                        {/* Tab Bar Container */}
                        <div className="relative">
                            {/* Sticky Tab Bar */}
                            <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 mb-8 sticky top-[64px] bg-background-light dark:bg-background-dark z-20 overflow-x-auto no-scrollbar py-2 transition-all duration-300">
                                {tabs.map((tab, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveTab(tab)}
                                        className={`py-4 text-sm font-black whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Tab Content */}
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {activeTab === 'Rooms & Rates' && (
                                    <div className="space-y-6">
                                        {[1, 2].map((room) => (
                                            <div key={room} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[32px] overflow-hidden flex flex-col md:flex-row group transition-all hover:shadow-2xl hover:shadow-slate-200 dark:hover:shadow-none">
                                                <div className="md:w-80 relative overflow-hidden shrink-0">
                                                    <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={images[room % images.length]} alt="" />
                                                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                                                        <span className="material-symbols-outlined text-xs">photo_camera</span> 2 Photos
                                                    </div>
                                                </div>
                                                <div className="flex-1 p-8">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{room === 1 ? 'Deluxe King Room' : 'Executive Loft Suite'}</h3>
                                                            <div className="flex gap-4 text-slate-400 mb-4">
                                                                <span className="flex items-center gap-1.5 text-xs font-black"><span className="material-symbols-outlined text-sm text-primary">square_foot</span> 48 m²</span>
                                                                <span className="flex items-center gap-1.5 text-xs font-black"><span className="material-symbols-outlined text-sm text-primary">king_bed</span> King Bed</span>
                                                            </div>
                                                        </div>
                                                        <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-orange-200/20">
                                                            Most Popular
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2 mb-8">
                                                        {['Free WiFi', 'Air Conditioning', 'Mini-bar', 'Room Service'].map((feat, i) => (
                                                            <span key={i} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                                                                {feat}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-3xl border border-primary/20 flex items-center justify-between group/row hover:bg-primary/10 transition-colors cursor-pointer ring-2 ring-primary">
                                                        <div className="flex items-center gap-4">
                                                            <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                                                <span className="material-symbols-outlined text-xs">check</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm uppercase tracking-tighter text-slate-900 dark:text-white">B2B Special Rate</p>
                                                                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">cancel</span> Non-refundable
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-black text-primary">${hotel.price + (room * 75)}</p>
                                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Net / Night</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'Overview' && (
                                    <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                                        <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">About the Property</h2>
                                        <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                            {hotel.description || "Experience the ultimate luxury at our TOG-certified property."}
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'Amenities' && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                                        {hotel.amenities.map((amenity, idx) => (
                                            <div key={idx} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:border-primary/50 transition-all hover:shadow-lg group">
                                                <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-3xl">{amenity.icon}</span>
                                                </div>
                                                <span className="font-black text-sm uppercase tracking-tight">{amenity.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(activeTab === 'Policies' || activeTab === 'Reviews') && (
                                    <div className="bg-white dark:bg-slate-900/50 p-20 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                                        <div className="size-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-6 font-black uppercase tracking-widest">
                                            {activeTab[0]}
                                        </div>
                                        <h3 className="text-xl font-black uppercase mb-2">{activeTab} Details</h3>
                                        <p className="text-slate-500 font-medium tracking-tight">Data synchronized from Travel of Globe systems.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Booking Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-[88px] h-fit">
                        <div className="bg-white dark:bg-slate-900 border-2 border-primary rounded-[32px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group/sidebar">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <span className="material-symbols-outlined text-[120px]">apartment</span>
                            </div>

                            <div className="flex items-center gap-2 text-red-500 font-black text-xs mb-8 uppercase tracking-widest bg-red-500/5 p-3 rounded-2xl border border-red-500/10">
                                <span className="material-symbols-outlined text-sm fill-1">bolt</span>
                                Multi-Room Reservation • 4 Rooms Left
                            </div>

                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Reservation Summary</p>
                            <div className="space-y-4 mb-8">
                                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                                    <div className="flex justify-between font-black mb-1">
                                        <span>1. Deluxe King Room</span>
                                        <span>$200.00</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Room Only • Non-refundable</p>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                                    <div className="flex justify-between font-black mb-1">
                                        <span>2. Executive Suite</span>
                                        <span>$450.00</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Breakfast Included • Free Cancellation</p>
                                </div>
                            </div>

                            <div className="pt-8 border-t-2 border-dashed border-slate-100 dark:border-slate-800 mb-8">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Stay Price (Net)</p>
                                        <p className="text-3xl font-black text-primary leading-none">$650.00</p>
                                    </div>
                                    <button className="text-primary group-hover/sidebar:rotate-12 transition-transform">
                                        <span className="material-symbols-outlined">expand_more</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsBookingModalOpen(true)}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-[20px] transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] mb-4 group/btn">
                                Instant Reservation
                                <span className="material-symbols-outlined text-[20px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                            <p className="text-[10px] text-center text-slate-400 font-black uppercase tracking-widest">
                                B2B Agency Rates Applied
                            </p>
                        </div>

                        <div className="mt-6 bg-slate-100 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4">
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
            <BookingConfirmationModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                hotelName={hotel.name}
            />
        </div>
    );
};

export default HotelDetail;
