import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { mockHotels } from '../data/mockHotels';

const HotelDetail = () => {
    const { id } = useParams();
    const hotel = mockHotels.find(h => h.id === parseInt(id)) || mockHotels[0];
    const [activeImg, setActiveImg] = React.useState(0);
    const images = hotel.images || [hotel.image];

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200">
            <Header />

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Breadcrumbs />
                    <Link to="/" className="flex items-center gap-1.5 text-sm font-bold text-primary group">
                        <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Search
                    </Link>
                </div>

                {/* Modern Image Gallery */}
                <div className="flex flex-col lg:flex-row gap-6 mb-12 h-[500px]">
                    <div className="flex-1 rounded-3xl overflow-hidden relative group">
                        <img
                            src={images[activeImg]}
                            alt={hotel.name}
                            className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                        />

                        {/* Navigation Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8 gap-4 pointer-events-none">
                            <div className="flex flex-col pointer-events-auto">
                                <h1 className="text-white text-3xl font-black mb-2">{hotel.name}</h1>
                                <div className="flex items-center gap-2 text-white/90">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span className="font-bold text-sm">{hotel.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Badge */}
                        {hotel.badges?.[0] && (
                            <div className={`absolute top-6 left-6 ${hotel.badges[0].color} text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl backdrop-blur-md border border-white/20 animate-bounce-slow`}>
                                {hotel.badges[0].label}
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Sidebar */}
                    <div className="w-full lg:w-[220px] flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImg(idx)}
                                className={`
                                    relative min-w-[120px] lg:w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 transition-all shrink-0
                                    ${activeImg === idx ? 'border-primary shadow-lg ring-4 ring-primary/10 scale-95' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}
                                `}
                            >
                                <img src={img} className="w-full h-full object-cover" alt="" />
                                {activeImg === idx && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="size-8 bg-white rounded-full flex items-center justify-center text-primary shadow-lg">
                                            <span className="material-symbols-outlined text-[16px] font-black">play_arrow</span>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8">
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                            <div className="bg-white dark:bg-[#111a22] p-5 rounded-2xl border border-slate-200 dark:border-[#233648] shadow-sm flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-primary mb-2">hotelClass</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Stars</span>
                                <span className="font-bold text-sm">5 Star Resort</span>
                            </div>
                            <div className="bg-white dark:bg-[#111a22] p-5 rounded-2xl border border-slate-200 dark:border-[#233648] shadow-sm flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-emerald-500 mb-2">verified</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Status</span>
                                <span className="font-bold text-sm">TOG Certified</span>
                            </div>
                            <div className="bg-white dark:bg-[#111a22] p-5 rounded-2xl border border-slate-200 dark:border-[#233648] shadow-sm flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-orange-500 mb-2">speed</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Response</span>
                                <span className="font-bold text-sm">&lt; 15 mins</span>
                            </div>
                            <div className="bg-white dark:bg-[#111a22] p-5 rounded-2xl border border-slate-200 dark:border-[#233648] shadow-sm flex flex-col items-center text-center">
                                <span className="material-symbols-outlined text-blue-500 mb-2">groups</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Capacity</span>
                                <span className="font-bold text-sm">2-10 Adults</span>
                            </div>
                        </div>

                        <div className="space-y-12">
                            {/* Tabs Style Section */}
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="h-8 w-1.5 bg-primary rounded-full"></div>
                                    <h2 className="text-2xl font-black">About the Property</h2>
                                </div>
                                <div className="bg-white dark:bg-[#111a22] rounded-3xl p-8 border border-slate-200 dark:border-[#233648] shadow-sm">
                                    <p className="text-slate-600 dark:text-slate-400 leading-[1.8] text-lg mb-6">
                                        {hotel.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm mb-1 uppercase tracking-tighter">Premium Service</h4>
                                                <p className="text-xs text-slate-500">24/7 Concierge available</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 rounded-xl bg-orange-500/5 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-orange-500 text-[20px]">distance</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm mb-1 uppercase tracking-tighter">Prime Location</h4>
                                                <p className="text-xs text-slate-500">Heart of Santorini</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="h-8 w-1.5 bg-primary rounded-full"></div>
                                    <h2 className="text-2xl font-black">Top Amenities</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {hotel.amenities.map((amenity, idx) => (
                                        <div key={idx} className="group bg-white dark:bg-[#111a22] p-6 rounded-2xl border border-slate-200 dark:border-[#233648] hover:border-primary/50 transition-all flex items-center gap-4 hover:shadow-md">
                                            <div className="size-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-[28px]">{amenity.icon}</span>
                                            </div>
                                            <span className="font-black text-sm uppercase tracking-tight">{amenity.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Booking Sidebar - Enhanced */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                        <div className="bg-white dark:bg-[#111a22] rounded-3xl p-8 border-2 border-primary shadow-2xl relative">
                            <div className="absolute -top-4 left-8 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                                B2B Exclusive Rate
                            </div>

                            <div className="flex items-end justify-between mb-8 pt-4">
                                <div>
                                    <span className="text-4xl font-black text-primary">${hotel.price}</span>
                                    <span className="text-slate-400 font-bold ml-1">/ NIGHT</span>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-amber-400 font-black text-sm mb-1">
                                        <span className="material-symbols-outlined text-sm fill-1">star</span>
                                        {hotel.rating}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{hotel.ratingLabel}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <button className="w-full p-4 rounded-2xl border border-slate-200 dark:border-[#233648] hover:border-primary bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between transition-all group">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Check-in</p>
                                        <p className="text-sm font-bold">12 Sep 2026</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">calendar_today</span>
                                </button>
                                <button className="w-full p-4 rounded-2xl border border-slate-200 dark:border-[#233648] hover:border-primary bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between transition-all group">
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Guests</p>
                                        <p className="text-sm font-bold">2 Adults, 1 Room</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">person</span>
                                </button>
                            </div>

                            <div className="pt-6 border-t border-slate-100 dark:border-[#233648] space-y-4 mb-8">
                                <div className="flex justify-between items-center text-slate-500 font-medium">
                                    <span className="text-sm">Room Subtotal</span>
                                    <span className="font-bold text-slate-900 dark:text-white">$450.00</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-500 font-medium">
                                    <span className="text-sm">B2B Service Fee</span>
                                    <span className="font-bold text-slate-900 dark:text-white">$0.00</span>
                                </div>
                                <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl">
                                    <span className="font-black text-sm uppercase tracking-widest text-primary">Total Pay</span>
                                    <span className="text-2xl font-black text-primary">${hotel.price}.00</span>
                                </div>
                            </div>

                            <button className="w-full group bg-primary hover:bg-primary/90 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 mb-4">
                                <span className="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-1">bolt</span>
                                Instant Booking
                            </button>

                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                                <span className="text-emerald-500">FREE CANCELLATION</span> • UNTIL SEP 10
                            </p>
                        </div>

                        <div className="mt-6 flex gap-4">
                            <button className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-[#233648] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <span className="material-symbols-outlined text-sm">share</span> Share
                            </button>
                            <button className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-[#233648] text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-red-500">
                                <span className="material-symbols-outlined text-sm">favorite</span> Wishlist
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HotelDetail;
