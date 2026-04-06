import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import HotelCard from '../components/HotelCard';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { parseGuestsParam } from '../utils/searchParamsUtils';
import { hotelService } from '../services/hotelService';
import { locationService } from '../services/locationService';
import placeholderHotel from '../assets/placeholder-hotel.svg';

const HotelListing = () => {
    const [viewMode, setViewMode] = React.useState('list'); // 'list', 'grid2', 'grid3'
    const { slug, theme, campaign } = useParams();
    const [searchParams] = useSearchParams();

    const [hotels, setHotels] = React.useState([]);
    const [page, setPage] = React.useState(0); // API uses 0-based indexing
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasMore, setHasMore] = React.useState(true);
    const [totalProperties, setTotalProperties] = React.useState(0);
    const [dynamicFilters, setDynamicFilters] = React.useState(null);
    const [locationNames, setLocationNames] = React.useState({});
    const loaderRef = React.useRef(null);

    const gridClasses = {
        'list': 'grid-cols-1',
        'grid2': 'grid-cols-1 md:grid-cols-2',
        'grid3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
    };

    // Parse params
    const roomState = useMemo(() => {
        const guestsParam = searchParams.get('guests');
        if (guestsParam) {
            return parseGuestsParam(guestsParam);
        }
        // Fallback for old links
        const adults = searchParams.get('adults');
        const children = searchParams.get('children');
        return [{ adults: parseInt(adults) || 2, children: parseInt(children) || 0, childAges: [] }];
    }, [searchParams]);

    // Computed totals
    const totalAdults = roomState.reduce((sum, r) => sum + r.adults, 0);
    const totalChildren = roomState.reduce((sum, r) => sum + r.children, 0);
    const totalRooms = roomState.length;
    const totalGuests = totalAdults + totalChildren;

    // Get location name from query parameter
    const queryLocation = searchParams.get('q');
    const locationName = queryLocation
        ? queryLocation.split(',')[0].trim()
        : slug
            ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            : 'Santorini';

    const themeName = theme ? theme.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
    const campaignName = campaign ? campaign.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;

    const pageTitle = campaignName
        ? `${campaignName} Hotels`
        : themeName
            ? `${themeName} Hotels`
            : `Hotels in ${locationName}`;

    // Extract locationId from URL params
    const locationId = searchParams.get('locationId');

    const subtitle = `${totalRooms} Room${totalRooms > 1 ? 's' : ''}, ${totalGuests} Guest${totalGuests !== 1 ? 's' : ''} • ${totalProperties || 0} properties found`;

    // Map API hotel object to UI model
    const mapApiHotelToModel = React.useCallback((apiHotel) => {
        // Pick name and star based on language
        const name = apiHotel.name?.tr || apiHotel.name?.en || apiHotel.name?.defaultName || 'Unknown Hotel';
        
        // Dynamic Stars - new object structure
        const starCount = apiHotel.hotelStar?.star || 0;
        const starLabel = apiHotel.hotelStar?.names?.tr || apiHotel.hotelStar?.names?.en || '';

        // Convert score (e.g. 80000) to rating (e.g. 8.0)
        const rating = apiHotel.score ? (apiHotel.score / 10000).toFixed(1) : '0';

        // Rating labels
        let ratingLabel = 'Good';
        const ratingVal = parseFloat(rating);
        if (ratingVal >= 9) ratingLabel = 'Superb';
        else if (ratingVal >= 8) ratingLabel = 'Excellent';
        else if (ratingVal >= 7) ratingLabel = 'Very Good';

        // Default amenities if none provided in API
        const amenities = [
            { icon: 'wifi', label: 'WiFi' },
            { icon: 'pool', label: 'Pool' },
            { icon: 'spa', label: 'Spa' }
        ];

        // Handle images with thumbnail priority and local silhouette fallbacks
        let imagesToMap = [];
        
        if (apiHotel.images && apiHotel.images.length > 0) {
            // Sort by isThumbnail so thumbnail is always first
            const sorted = [...apiHotel.images].sort((a, b) => (b.isThumbnail ? 1 : 0) - (a.isThumbnail ? 1 : 0));
            
            // Filter: must be the thumbnail OR have 'hotel' category
            const filtered = sorted.filter(img => 
                img.isThumbnail || (img.category && img.category.toLowerCase() === 'hotel')
            );
            
            // Map to URLs and deduplicate while maintaining order (thumbnail first)
            imagesToMap = [...new Set(filtered.map(img => img.url))].filter(url => !!url);
        }

        if (imagesToMap.length === 0) {
            imagesToMap = [placeholderHotel];
        }

        return {
            id: apiHotel.id,
            name: name,
            type: starLabel || 'Hotel',
            stars: starCount,
            location: apiHotel.locationPathNames || 'Unknown Location',
            image: imagesToMap[0],
            images: imagesToMap,
            rating: rating,
            ratingLabel: ratingLabel,
            ratingColor: 'bg-primary/10 text-primary',
            price: 450, // Static for now as requested
            lat: apiHotel.coordinates?.lat,
            lng: apiHotel.coordinates?.lon,
            amenities: amenities,
            transportations: apiHotel.transportations || [],
            badges: apiHotel.isNewProperty ? [{ type: 'popular', label: 'New Property', color: 'bg-teal-500/40' }] : []
        };
    }, []);

    // Load hotels from API
    const loadMoreHotels = React.useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        try {
            // Extract selected filters from search params
            const starsParam = searchParams.get('stars');
            const hotelStarCategoryIds = starsParam ? starsParam.split(',').map(s => parseInt(s)) : null;
            const parseBoolParam = (val) => val === 'true' ? true : val === 'false' ? false : null;
            const hasFreeCancellation = parseBoolParam(searchParams.get('freeCancellation'));
            const hasPrePayment = parseBoolParam(searchParams.get('prePayment'));
            const locationsParam = searchParams.get('locations');
            const filterLocationIds = locationsParam ? locationsParam.split(',').map(s => parseInt(s)) : null;

            const response = await hotelService.searchHotels({
                locationId,
                page: page,
                size: 10,
                filters: {
                    hotelStarCategoryIds,
                    hasFreeCancellation,
                    hasPrePayment,
                    locationIds: filterLocationIds,
                }
            });

            if (response && response.data) {
                // response is the JSON payload. response.data is the page object, response.filters is the filters object.
                const pageData = response.data;
                const filtersData = response.filters || response.data.filters; // Keep fallback just in case

                const content = pageData.content || [];
                const last = pageData.last;
                const totalElements = pageData.totalElements;

                const mappedHotels = content.map(mapApiHotelToModel);

                setHotels(prev => page === 0 ? mappedHotels : [...prev, ...mappedHotels]);
                setTotalProperties(totalElements);
                
                // Always update dynamic filter counts on a fresh search
                if (page === 0) {
                    if (filtersData) {
                        setDynamicFilters(filtersData);
                    }
                }

                // Extract location names from breadcrumbs continuously across all pages
                const newLocationNames = {};
                content.forEach(hotel => {
                    if (hotel.locationBreadcrumbs) {
                        hotel.locationBreadcrumbs.forEach(crumb => {
                            if (crumb.locationId && crumb.name) {
                                newLocationNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                            }
                        });
                    }
                });
                
                // Only update state if we found new names we didn't have before to avoid unnecessary renders
                setLocationNames(prev => {
                    let hasNew = false;
                    for (const [key, val] of Object.entries(newLocationNames)) {
                        if (prev[key] !== val) hasNew = true;
                    }
                    return hasNew ? { ...prev, ...newLocationNames } : prev;
                });

                setPage(prev => prev + 1);
                setHasMore(!last);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to load hotels:', error);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [page, isLoading, hasMore, locationId, mapApiHotelToModel]);

    // Fetch names for any locations in the filters that we haven't seen in the hotel results yet
    React.useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.locationId) return;

        const missingLocIds = dynamicFilters.locationId
            .map(f => f.value)
            .filter(id => !locationNames[id]);

        if (missingLocIds.length === 0) return;

        let isMounted = true;
        
        const fetchMissingNames = async () => {
            const newNames = {};
            // Fetch in parallel using Promise.allSettled to not break on a single failure
            await Promise.allSettled(missingLocIds.map(async (id) => {
                try {
                    const data = await locationService.fetchBreadcrumb(id);
                    if (data && data.data && Array.isArray(data.data)) {
                         // Some endpoints return the array in data.data
                         data.data.forEach(crumb => {
                             if (crumb.locationId && crumb.name) {
                                 newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                             }
                         });
                    } else if (data && data.breadcrumbs) {
                         data.breadcrumbs.forEach(crumb => {
                             if (crumb.locationId && crumb.name) {
                                 newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                             }
                         });
                    }
                } catch (error) {
                    console.error(`Failed to fetch breadcrumb for location ${id}`, error);
                }
            }));

            if (isMounted && Object.keys(newNames).length > 0) {
                setLocationNames(prev => ({ ...prev, ...newNames }));
            }
        };

        fetchMissingNames();

        return () => { isMounted = false; };
    }, [dynamicFilters, locationNames]);

    // Reset when locationId or other filters change
    React.useEffect(() => {
        setHotels([]);
        setPage(0);
        setHasMore(true);
        setTotalProperties(0);
        // Only clear dynamic filters if location changes, not when other filters change
    }, [locationId, searchParams.get('stars'), searchParams.get('freeCancellation'), searchParams.get('prePayment'), searchParams.get('locations')]);

    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore && !isLoading) {
                loadMoreHotels();
            }
        }, { threshold: 0.1 });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [loadMoreHotels, hasMore, isLoading]);

    return (
        <div className="relative flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200 font-sans">
            <Header />
            <main className="flex-1 max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <Breadcrumbs locationId={locationId} />
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all group"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm" >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                        </div>
                        Back to Dashboard
                    </Link>
                </div>
                <div className="flex flex-col lg:flex-row gap-8">
                    <Sidebar filters={dynamicFilters} locationNames={locationNames} />
                    {/* Grid Content Area */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">{pageTitle}</h1>
                                <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
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
                                to={`/map?${searchParams.toString()}`}
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
                            {hotels.map(hotel => (
                                <HotelCard key={hotel.id} hotel={hotel} viewMode={viewMode} />
                            ))}
                        </div>

                        {/* Loading Sentinel */}
                        <div ref={loaderRef} className="mt-12 py-8 flex flex-col items-center justify-center gap-4">
                            {isLoading && (
                                <>
                                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Loading properties...</p>
                                </>
                            )}
                            {!hasMore && hotels.length > 0 && (
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-slate-800 pt-8 w-full text-center">
                                    You've reached the end of the list
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default HotelListing;
