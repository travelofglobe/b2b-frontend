import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import HotelCard from '../components/HotelCard';
import Pagination from '../components/Pagination';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { mockHotels } from '../data/mockHotels';

const HotelListing = () => {
    const [viewMode, setViewMode] = React.useState('grid3'); // 'list', 'grid2', 'grid3'

    const gridClasses = {
        'list': 'grid-cols-1',
        'grid2': 'grid-cols-1 md:grid-cols-2',
        'grid3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
    };

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200">
            <Header />
            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <Breadcrumbs />
                <div className="flex flex-col lg:flex-row gap-8">
                    <Sidebar />
                    {/* Grid Content Area */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Hotels in Santorini</h1>
                                <p className="text-slate-500 text-sm font-medium">142 properties matching your search</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-500 whitespace-nowrap">SORT BY:</span>
                                <select className="bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-lg text-sm font-bold py-2 pl-4 pr-10 focus:ring-primary focus:border-primary">
                                    <option>Most Recommended</option>
                                    <option>Price (Low to High)</option>
                                    <option>Guest Rating</option>
                                    <option>Star Rating</option>
                                </select>
                            </div>
                        </div>

                        {/* View Controls Toolbar */}
                        <div className="bg-white dark:bg-[#111a22] border border-slate-200 dark:border-[#233648] rounded-xl p-3 mb-8 flex items-center justify-between shadow-sm">
                            <Link
                                to="/map"
                                className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-outlined text-primary">map</span>
                                Map View
                            </Link>

                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">view_list</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid2')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid2' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">grid_view</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('grid3')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid3' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">grid_on</span>
                                </button>
                                <button
                                    className="p-1.5 rounded-md text-slate-300 cursor-not-allowed"
                                    disabled
                                >
                                    <span className="material-symbols-outlined text-xl">apps</span>
                                </button>
                            </div>
                        </div>

                        {/* Hotel Grid */}
                        <div className={`grid gap-6 ${gridClasses[viewMode]}`}>
                            {mockHotels.map(hotel => (
                                <HotelCard key={hotel.id} hotel={hotel} viewMode={viewMode} />
                            ))}
                        </div>
                        <Pagination />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default HotelListing;
