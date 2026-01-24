import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { mockHotels } from '../data/mockHotels';

const HotelDetail = () => {
    const { id } = useParams();
    const hotel = mockHotels.find(h => h.id === parseInt(id)) || mockHotels[0];

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200">
            <Header />

            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Breadcrumbs />
                    <Link to="/" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Back to Search
                    </Link>
                </div>

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 h-[500px]">
                    <div className="lg:col-span-2 rounded-2xl overflow-hidden relative">
                        <img
                            src={hotel.images?.[0] || hotel.image}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                        />
                        {hotel.featured && (
                            <div className="absolute top-6 left-6 bg-primary text-white text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-xl">
                                Featured Property
                            </div>
                        )}
                    </div>
                    <div className="hidden lg:grid grid-rows-2 gap-4">
                        <div className="rounded-2xl overflow-hidden">
                            <img
                                src={hotel.images?.[1] || hotel.image}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="rounded-2xl overflow-hidden relative">
                            <img
                                src={hotel.images?.[2] || hotel.image}
                                className="w-full h-full object-cover"
                            />
                            <button className="absolute inset-0 bg-black/40 hover:bg-black/50 transition-colors flex items-center justify-center text-white font-bold gap-2">
                                <span className="material-symbols-outlined">grid_view</span>
                                View All Photos
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-black mb-2">{hotel.name}</h1>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span className="font-medium">{hotel.location}</span>
                                    <span className="text-primary hover:underline cursor-pointer text-sm font-bold ml-2">Show on Map</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className={`${hotel.ratingColor} px-3 py-2 rounded-xl text-right`}>
                                    <div className="text-xl font-black leading-none">{hotel.rating}</div>
                                    <div className="text-[10px] font-bold uppercase leading-none mt-1">{hotel.ratingLabel}</div>
                                </div>
                                <span className="text-xs text-slate-400 mt-2 font-medium">from 1,240 reviews</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-[#233648] py-8">
                            <h2 className="text-xl font-bold mb-4">Overview</h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {hotel.description || "No description available for this property."}
                            </p>
                        </div>

                        <div className="border-t border-slate-200 dark:border-[#233648] py-8">
                            <h2 className="text-xl font-bold mb-6">Popular Amenities</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {hotel.amenities.map((amenity, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                                        <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">{amenity.icon}</span>
                                        </div>
                                        <span className="font-semibold text-sm">{amenity.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24 bg-white dark:bg-[#111a22] rounded-2xl p-6 border border-slate-200 dark:border-[#233648] shadow-xl">
                            <div className="flex items-baseline justify-between mb-6">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Price per night</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black">${hotel.price}</span>
                                        <span className="text-sm text-slate-400 font-medium">/night</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-500 font-black rounded uppercase">Best Value</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#233648] bg-slate-50 dark:bg-slate-800/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Selected Dates</p>
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span>Sep 12 - Sep 18</span>
                                        <span className="material-symbols-outlined text-primary">calendar_month</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#233648] bg-slate-50 dark:bg-slate-800/50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Guests</p>
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span>2 Adults, 0 Children</span>
                                        <span className="material-symbols-outlined text-primary">group</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>$450 x 6 nights</span>
                                    <span className="font-bold text-slate-900 dark:text-white">$2,700</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-500">
                                    <span>Service fee</span>
                                    <span className="font-bold text-slate-900 dark:text-white">$120</span>
                                </div>
                                <div className="pt-3 border-t border-slate-200 dark:border-[#233648] flex justify-between items-center font-black">
                                    <span className="text-lg">Total</span>
                                    <span className="text-2xl text-primary">$2,820</span>
                                </div>
                            </div>

                            <button className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-primary/20 mb-3">
                                Reserve Now
                            </button>
                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Free cancellation before Sep 10</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HotelDetail;
