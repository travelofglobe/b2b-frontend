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
    const abortControllerRef = React.useRef(null);

    /**
     * Build the request body from current search state and URL params
     */
    const getSearchParams = () => {
        const starsParam = searchParams.get('stars');
        const freeCancellationParam = searchParams.get('freeCancellation');
        const prePaymentParam = searchParams.get('prePayment');
        const locationsParam = searchParams.get('locations');
        const roomTwinParam = searchParams.get('roomTwin');
        const roomMaxAdultParam = searchParams.get('roomMaxAdult');
        const roomMaxChildrenParam = searchParams.get('roomMaxChildren');
        const roomMaxExtraBedParam = searchParams.get('roomMaxExtraBed');
        const roomPaxCapacityParam = searchParams.get('roomPaxCapacity');

        return {
            stars: starsParam ? starsParam.split(',').map(Number) : [],
            freeCancellation: freeCancellationParam === 'true' ? true : freeCancellationParam === 'false' ? false : null,
            prePayment: prePaymentParam === 'true' ? true : prePaymentParam === 'false' ? false : null,
            locations: locationsParam ? locationsParam.split(',').map(Number) : [],
            roomTwin: roomTwinParam === 'true' ? true : roomTwinParam === 'false' ? false : null,
            roomMaxAdult: roomMaxAdultParam ? roomMaxAdultParam.split(',').map(Number) : null,
            roomMaxChildren: roomMaxChildrenParam ? roomMaxChildrenParam.split(',').map(Number) : null,
            roomMaxExtraBed: roomMaxExtraBedParam ? roomMaxExtraBedParam.split(',').map(Number) : null,
            roomPaxCapacity: roomPaxCapacityParam ? roomPaxCapacityParam.split(',').map(Number) : null
        };
    };
    const [locationNames, setLocationNames] = React.useState({});
    const loaderRef = React.useRef(null);

    const gridClasses = {
        'list': 'grid-cols-1',
        'grid2': 'grid-cols-1 lg:grid-cols-2',
        'grid3': 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3',
        'grid4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
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

        const hotelBadges = [];
        if (apiHotel.isNewProperty) {
            hotelBadges.push({ type: 'popular', label: 'New Property', color: 'bg-teal-500/80' });
        }
        if (apiHotel.preferred) {
            hotelBadges.push({ type: 'featured', label: 'Preferred', color: 'bg-amber-500/80' });
        }
        if (apiHotel.exclusive) {
            hotelBadges.push({ type: 'exclusive', label: 'Exclusive', color: 'bg-purple-500/80' });
        }

        return {
            id: apiHotel.id,
            name: name,
            type: starLabel || 'Hotel',
            stars: starCount,
            location: apiHotel.locationPathNames?.replace(/,/g, ', ') || 'Unknown Location',
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
            badges: hotelBadges
        };
    }, []);

    // Initial load: fetch location names if possible (mocked for now or from crumbs)
    React.useEffect(() => {
        console.log('HotelListing mounted with locationId:', locationId);
    }, []);

    // Load hotels from API
    const loadMoreHotels = React.useCallback(async (isReset = false) => {
        // If we are resetting, we cancel any existing request
        if (isReset && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }

        // If not a reset and already loading, skip
        if (!isReset && (isLoading || !hasMore)) return;

        setIsLoading(true);
        
        // Create new AbortController for this request
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const filters = getSearchParams();
            const currentPage = isReset ? 0 : page;

            const response = await hotelService.searchHotels({
                locationId,
                page: currentPage,
                size: 10,
                filters: {
                    locationIds: filters.locations?.length > 0 ? filters.locations : (locationId ? [parseInt(locationId)] : null),
                    stars: filters.stars,
                    hasFreeCancellation: filters.freeCancellation,
                    hasPrePayment: filters.prePayment,
                    roomTwin: filters.roomTwin,
                    roomMaxAdult: filters.roomMaxAdult,
                    roomMaxChildren: filters.roomMaxChildren,
                    roomMaxExtraBed: filters.roomMaxExtraBed,
                    roomPaxCapacity: filters.roomPaxCapacity
                },
                signal: controller.signal
            });

            if (response && response.data) {
                const pageData = response.data;
                const filtersData = response.filters || response.data.filters;
                const content = pageData.content || [];
                const mappedHotels = content.map(h => mapApiHotelToModel(h));

                setHotels(prev => currentPage === 0 ? mappedHotels : [...prev, ...mappedHotels]);
                setTotalProperties(pageData.totalElements || 0);

                if (currentPage === 0 && filtersData) {
                    setDynamicFilters(filtersData);
                }

                setHasMore(!pageData.last);
                setPage(currentPage + 1);

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

                if (Object.keys(newLocationNames).length > 0) {
                    setLocationNames(prev => ({ ...prev, ...newLocationNames }));
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Search request cancelled');
            } else {
                console.error('Error fetching hotels:', error);
                setHasMore(false);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoading(false);
            }
        }
    }, [page, isLoading, hasMore, locationId, mapApiHotelToModel, searchParams]);

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
        
        // Explicitly trigger first fetch on reset
        loadMoreHotels(true);

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [
        locationId,
        searchParams.get('stars'),
        searchParams.get('freeCancellation'),
        searchParams.get('prePayment'),
        searchParams.get('locations'),
        searchParams.get('roomTwin'),
        searchParams.get('roomMaxAdult'),
        searchParams.get('roomMaxChildren'),
        searchParams.get('roomMaxExtraBed'),
        searchParams.get('roomPaxCapacity')
    ]);

    React.useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [locationId]);

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
                                    onClick={() => setViewMode('grid4')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid4' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
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
