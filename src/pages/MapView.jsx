import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Tooltip from '../components/Tooltip';
import Breadcrumbs from '../components/Breadcrumbs';
import { locationService } from '../services/locationService';
import { hotelService } from '../services/hotelService';
import placeholderHotel from '../assets/placeholder-hotel.svg';
import { useMapEvents } from 'react-leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import FilterPanel from '../components/FilterPanel';
import { parseGuestsParam } from '../utils/searchParamsUtils';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Component
const CustomPriceMarker = ({ hotel, isSelected, isHovered, onSelect, onHover, searchParams }) => {
    const icon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div class="relative group cursor-pointer flex flex-col items-center w-max mx-auto">
                <div class="px-3 py-1.5 rounded-2xl font-black text-sm shadow-2xl transition-all border-2 flex items-center gap-1 whitespace-nowrap ${isSelected || isHovered
                ? 'bg-[#137fec] text-white border-white scale-110 ring-4 ring-[#137fec]/20'
                : 'bg-white/90 backdrop-blur-md text-slate-900 border-white/20'
            }">
                    <span class="text-[10px] opacity-70 leading-none">$</span>
                    ${hotel.price}
                </div>
                <div class="w-0.5 h-3 mt-0.5 transition-colors ${isSelected || isHovered ? 'bg-[#137fec]' : 'bg-white/40'}"></div>
            </div>
        `,
        iconSize: [120, 50],
        iconAnchor: [60, 50],
    });

    return (
        <Marker
            position={[hotel.lat, hotel.lng]}
            icon={icon}
            zIndexOffset={isSelected ? 1000 : (isHovered ? 500 : 0)}
            eventHandlers={{
                click: () => onSelect(hotel),
                mouseover: () => onHover(hotel),
                mouseout: () => onHover(null)
            }}
        >
            <Popup className="hotel-marker-popup" minWidth={240}>
                <div className="p-1 group/popup">
                    <img src={hotel.image} className="w-full h-32 object-cover rounded-xl mb-3" alt={hotel.name} />
                    <h3 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white mb-1">{hotel.names?.tr || hotel.names?.en || hotel.name}</h3>
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-black text-primary leading-none tracking-tighter">${hotel.price}</span>
                        <Link
                            to={`/hotel/${hotel.hotelId}?${searchParams.toString()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary text-white text-[9px] font-black tracking-widest uppercase px-3 py-2 rounded-lg hover:scale-105 transition-all shadow-lg shadow-primary/20"
                        >
                            View Details
                        </Link>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

// Map Controller for FlyTo
const MapController = ({ selectedHotel }) => {
    const map = useMap();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        if (selectedHotel && map) {
            try {
                // Ensure map exists and hasn't been removed from DOM
                if (map.getContainer()) {
                    map.stop();
                    map.flyTo([selectedHotel.lat, selectedHotel.lng], 15, {
                        duration: 1.5
                    });
                }
            } catch (err) {
                console.warn('Map flyTo (hotel) failed:', err);
            }
            return () => {
                try {
                    if (isMounted.current && map && map.getContainer()) {
                        map.stop();
                    }
                } catch (e) {
                    // Silent catch for unmount phase
                }
            };
        }
    }, [selectedHotel, map]);
    return null;
};

// Glass Filter Modal Component
const FilterModal = ({ isOpen, onClose, filters, locationNames, facilityNames }) => {
    const [searchParams, setSearchParams] = useSearchParams();

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/20 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-300 h-[85vh] max-h-[800px] flex flex-col">
                
                <div className="flex-1 overflow-hidden">
                    <FilterPanel 
                        filters={filters}
                        locationNames={locationNames}
                        facilityNames={facilityNames}
                        searchParams={searchParams}
                        setSearchParams={setSearchParams}
                        onApply={onClose}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
};

// Map Instances & Events
const MapInstanceCapture = ({ setMap }) => {
    const map = useMap();
    useEffect(() => {
        if (map) {
            setMap(map);
            // Ensure map knows its container size on mount
            map.invalidateSize();
        }
        return () => setMap(null);
    }, [map, setMap]);
    return null;
};

// Mapping of facility IDs to Material Icon names and English labels
const FACILITY_ICON_MAP = {
    98445: { icon: 'wifi', label: 'Free Wifi' },
    48325: { icon: 'wifi', label: 'Wifi Access' },
    3664: { icon: 'wifi', label: 'High Speed Internet' },
    616: { icon: 'pool', label: 'Outdoor Pool' },
    649: { icon: 'pool', label: 'Indoor Pool' },
    1685: { icon: 'pool', label: 'Kids Pool' },
    1985: { icon: 'spa', label: 'Spa' },
    1978: { icon: 'fitness_center', label: 'Health Club' },
    98455: { icon: 'fitness_center', label: 'Fitness' },
    47935: { icon: 'fitness_center', label: 'Gym' },
    641: { icon: 'restaurant', label: 'Restaurant' },
    3134: { icon: 'local_bar', label: 'Bar' },
    606: { icon: 'pets', label: 'Pets Allowed' },
    719: { icon: 'ac_unit', label: 'Air Conditioning' },
    101165: { icon: 'inventory_2', label: 'Minibar' },
    618: { icon: 'sports_tennis', label: 'Tennis' },
    3164: { icon: 'casino', label: 'Casino' },
    3154: { icon: 'nightlife', label: 'Night Club' },
    3891: { icon: 'hot_tub', label: 'Jacuzzi' },
    650: { icon: 'spa', label: 'Sauna' },
    3064: { icon: 'atm', label: 'ATM' },
    18006: { icon: 'business_center', label: 'Business Centre' },
    18366: { icon: 'local_laundry_service', label: 'Laundry' },
    603: { icon: 'child_care', label: 'Babysitting' },
    638: { icon: 'explore', label: 'Tour Desk' },
    646: { icon: 'support_agent', label: 'Concierge' },
    666: { icon: 'car_rental', label: 'Car Rental' },
    1993: { icon: 'lock', label: 'Safety Box' },
    1995: { icon: 'wheelchair_pickup', label: 'Wheelchair Access' },
    2007: { icon: 'elevator', label: 'Elevator' },
    98485: { icon: 'security', label: 'Security' },
    100075: { icon: 'smoking_rooms', label: 'Smoking Area' },
    1687: { icon: 'water_sports', label: 'Water Sports' },
    1981: { icon: 'child_friendly', label: 'Kids Club' },
    3724: { icon: 'beach_access', label: 'Beach' },
    18126: { icon: 'directions_bike', label: 'Bicycle Rental' },
    98415: { icon: 'airport_shuttle', label: 'Airport Shuttle' }
};

// MapBoundsListener
const MapBoundsListener = ({ onBoundsChange, isUserPanRef }) => {
    useMapEvents({
        mousedown: () => { isUserPanRef.current = true; },
        wheel: () => { isUserPanRef.current = true; },
        moveend: (e) => {
            const map = e.target;
            // Force recalculation of container dimensions before calculating bounds
            map.invalidateSize();
            
            const bounds = map.getBounds();
            const nw = bounds.getNorthWest();
            const se = bounds.getSouthEast();

            onBoundsChange({
                bounds: {
                    topLeft: { lat: nw.lat, lon: nw.lng },
                    bottomRight: { lat: se.lat, lon: se.lng }
                },
                isUserPan: isUserPanRef.current,
                zoom: map.getZoom()
            });
        }
    });
    return null;
};

// MapView Component
const MapView = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [hotels, setHotels] = useState([]);
    const [isLoadingHotels, setIsLoadingHotels] = useState(false);
    const [hoveredHotel, setHoveredHotel] = useState(null);
    const hoverTimeoutRef = useRef(null);
    const isUserPanRef = useRef(false);
    const abortControllerRef = useRef(null);
    const roomState = React.useMemo(() => {
        const guestsParam = searchParams.get('guests');
        return parseGuestsParam(guestsParam);
    }, [searchParams]);

    // Reset pan state when autocomplete search changes, but with a delay
    // to allow other context effects to check the pan status first
    useEffect(() => {
        const timer = setTimeout(() => {
            isUserPanRef.current = false;
        }, 1500); // 1.5s delay covers most fetch/fly transitions
        return () => clearTimeout(timer);
    }, [searchParams]);

    const handleHover = (hotel) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        if (hotel) {
            setHoveredHotel(hotel);
        } else {
            // Delay closing to allow user to move mouse to the card
            hoverTimeoutRef.current = setTimeout(() => {
                setHoveredHotel(null);
                hoverTimeoutRef.current = null;
            }, 300);
        }
    };
    const [selectedHotel, setSelectedHotel] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    
    // Dynamic Filter Data
    const [dynamicFilters, setDynamicFilters] = useState(null);
    const [locationNames, setLocationNames] = useState({});
    const [facilityNames, setFacilityNames] = useState({});

    // Map Instance State
    const [map, setMap] = useState(null);
    const [currentBounds, setCurrentBounds] = useState(null);

    // Breadcrumb data for map auto-focus
    const [breadcrumbData, setBreadcrumbData] = useState(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [hasInitialDataLoaded, setHasInitialDataLoaded] = useState(false);
    const isComponentMounted = useRef(true);

    useEffect(() => {
        isComponentMounted.current = true;
        return () => { isComponentMounted.current = false; };
    }, []);

    // Fetch location details when locationId or locations filter changes
    useEffect(() => {
        const fetchDetails = async () => {
            // Priority: Last selected filter location > primary locationId
            const locationsParam = searchParams.get('locations');
            const targetLocId = locationsParam 
                ? locationsParam.split(',').pop() 
                : searchParams.get('locationId');

            if (!targetLocId) {
                setIsDataLoading(false);
                return;
            }

            setIsDataLoading(true);
            try {
                const data = await locationService.fetchLocationDetails(targetLocId);
                if (!isComponentMounted.current) return;
                setBreadcrumbData(data);
                if (!hasInitialDataLoaded) setHasInitialDataLoaded(true);
            } catch (error) {
                if (isComponentMounted.current) {
                    console.error('Failed to fetch location details:', error);
                }
            } finally {
                if (isComponentMounted.current) {
                    setIsDataLoading(false);
                }
            }
        };

        fetchDetails();
    }, [searchParams.get('locationId'), searchParams.get('locations'), map]);

    // Fix map layout on sidebar toggle
    useEffect(() => {
        if (map) {
            // Trigger immediately and after transition to ensure smooth update
            map.invalidateSize();
            const timer = setTimeout(() => map.invalidateSize(), 300);
            return () => clearTimeout(timer);
        }
    }, [isSidebarOpen, map]);

    const handleBackToList = () => {
        const q = searchParams.get('q');
        let slug = q ? q.toLowerCase() : '';
        
        // Build hierarchical slug if possible
        if (q && q.includes(',')) {
            const queryParts = q.split(',').map(p => p.trim().toLowerCase());
            if (queryParts.length >= 2) {
                const reversed = queryParts.reverse();
                slug = reversed.slice(1).join('/');
            }
        }
        
        const baseUrl = slug ? `/hotels/${slug}` : '/hotels';
        navigate(`${baseUrl}?${searchParams.toString()}`);
    };

    // Auto-focus map on location from breadcrumb geoCoordinate
    useEffect(() => {
        // Skip auto-focus if this was triggered by a manual pan/exploration
        if (isUserPanRef.current) return;

        if (breadcrumbData && map && !isDataLoading) {
            if (breadcrumbData.geoCoordinate) {
                const { lat, lon } = breadcrumbData.geoCoordinate;
                const zoomLevels = {
                    'TOWN': 13,
                    'DISTRICT': 11,
                    'CITY': 10,
                    'COUNTRY': 6
                };
                const zoom = zoomLevels[breadcrumbData.locationType] || 10;

                try {
                    // Check if map container still exists
                    if (map.getContainer()) {
                        // Stop any existing animation before starting a new one
                        map.stop();
                        // Fly to location with smooth animation
                        map.flyTo([lat, lon], zoom, {
                            duration: 1.5, // Slightly faster for responsiveness
                            easeLinearity: 0.25
                        });
                    }
                } catch (err) {
                    console.warn('Map flyTo (location) failed:', err);
                }
            }
        }
        return () => {
            try {
                if (isComponentMounted.current && map && map.getContainer()) {
                    map.stop();
                }
            } catch (e) {
                // Ignore errors during unmount
            }
        };
    }, [breadcrumbData, map, isDataLoading]);

    const mapApiHotelToModel = React.useCallback((apiHotel) => {
        const hotelNames = apiHotel.names || apiHotel.name;
        const name = hotelNames?.tr || hotelNames?.en || hotelNames?.defaultName || 'Unknown Hotel';
        const starCount = apiHotel.hotelStar?.star || 0;
        const starLabel = apiHotel.hotelStar?.names?.tr || apiHotel.hotelStar?.names?.en || '';
        const rating = apiHotel.score ? (apiHotel.score / 10000).toFixed(1) : '0';

        let ratingLabel = 'Good';
        const ratingVal = parseFloat(rating);
        if (ratingVal >= 9) ratingLabel = 'Superb';
        else if (ratingVal >= 8) ratingLabel = 'Excellent';
        else if (ratingVal >= 7) ratingLabel = 'Very Good';

        // Dynamic Amenities - check multiple possible field names and formats
        let amenities = [];
        const rawFacs = apiHotel.hotelFacilityIds || apiHotel.facilities || apiHotel.facilityIds || apiHotel.hotelFacilities;
        
        if (rawFacs && Array.isArray(rawFacs)) {
            // Group by icon to avoid duplicates, but combine labels for the tooltip
            const iconGroups = {};
            
            rawFacs.forEach(f => {
                const id = typeof f === 'object' ? (f.facilityId || f.id || f.value) : f;
                const match = FACILITY_ICON_MAP[Number(id)];
                
                if (match) {
                    if (!iconGroups[match.icon]) {
                        iconGroups[match.icon] = { ...match, labels: [match.label] };
                    } else if (!iconGroups[match.icon].labels.includes(match.label)) {
                        iconGroups[match.icon].labels.push(match.label);
                    }
                }
            });

            // Convert back to array with labels array for the Tooltip's list display
            amenities = Object.values(iconGroups).map(group => ({
                icon: group.icon,
                label: group.labels // Pass as array for structured list
            })).slice(0, 6);
        }

        if (amenities.length === 0) {
            amenities = [{ icon: 'info', label: 'Details' }];
        }

        let imagesToMap = [];
        if (apiHotel.images && apiHotel.images.length > 0) {
            const sorted = [...apiHotel.images].sort((a, b) => (b.isThumbnail ? 1 : 0) - (a.isThumbnail ? 1 : 0));
            const filtered = sorted.filter(img =>
                img.isThumbnail || (img.category && img.category.toLowerCase() === 'hotel')
            );
            imagesToMap = [...new Set(filtered.map(img => img.url))].filter(url => !!url);
        }

        if (imagesToMap.length === 0) {
            imagesToMap = [placeholderHotel];
        }

        // Extract dynamic price and currency from the first room
        const firstRoom = apiHotel.rooms?.[0];
        const ratePrice = firstRoom?.ratePrice;
        const priceValue = ratePrice?.markupCalculatedPrice?.holder?.saleAmount || ratePrice?.calculatedAmount || 0;
        const currencyCode = ratePrice?.currency || 'USD';
        const totalTaxAmount = ratePrice?.totalTaxAmount || 0;

        return {
            id: apiHotel.id,
            hotelId: apiHotel.hotelId,
            name: name,
            type: starLabel || 'Hotel',
            stars: starCount,
            location: apiHotel.locationPathNames || 'Unknown Location',
            image: imagesToMap[0],
            images: imagesToMap,
            rating: rating,
            ratingLabel: ratingLabel,
            price: priceValue,
            currency: currencyCode,
            tax: totalTaxAmount,
            lat: apiHotel.coordinates?.lat,
            lng: apiHotel.coordinates?.lon,
            amenities: amenities,
            locationBreadcrumbs: apiHotel.locationBreadcrumbs,
            badges: apiHotel.isNewProperty ? [{ type: 'popular', label: 'New Property', color: 'bg-teal-500/40' }] : []
        };
    }, []);


    // Build search body from state exactly like HotelListing.jsx
    const getSearchFilters = useCallback(() => {
        const parseIds = (key, fallback = null) => {
            const val = searchParams.get(key);
            return val ? val.split(',').map(Number) : fallback;
        };
        const parseBool = (key) => {
            const val = searchParams.get(key);
            return val === 'true' ? true : val === 'false' ? false : null;
        };
        const getDefaultDates = () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);
            const fmt = (d) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };
            return { checkin: fmt(tomorrow), checkout: fmt(dayAfter) };
        };

        const defaults = getDefaultDates();
        return {
            locationIds: parseIds('locations', (searchParams.get('locationId') ? [parseInt(searchParams.get('locationId'))] : [])),
            stars: parseIds('stars', []),
            hasFreeCancellation: parseBool('freeCancellation'),
            hasPrePayment: parseBool('prePayment'),
            roomTwin: parseBool('roomTwin'),
            roomMaxAdult: parseIds('roomMaxAdult'),
            roomMaxChildren: parseIds('roomMaxChildren'),
            roomMaxExtraBed: parseIds('roomMaxExtraBed'),
            roomPaxCapacity: parseIds('roomPaxCapacity'),
            facilities: parseIds('facilities', []),
            _checkin: searchParams.get('checkin') || defaults.checkin,
            _checkout: searchParams.get('checkout') || defaults.checkout,
        };
    }, [searchParams]);

    const fetchHotels = useCallback(async (boundsData) => {
        // Abort previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoadingHotels(true);
        try {
            // Include all dynamic filters in map request
            const params = getSearchFilters();
            
            // Construct a clean filters object for the API
            const filtersBody = {
                locationIds: boundsData.isUserPan ? [] : params.locationIds,
                stars: params.stars || [],
                hasFreeCancellation: params.hasFreeCancellation,
                hasPrePayment: params.hasPrePayment,
                roomTwin: params.roomTwin,
                roomMaxAdult: params.roomMaxAdult,
                roomMaxChildren: params.roomMaxChildren,
                roomMaxExtraBed: params.roomMaxExtraBed,
                roomPaxCapacity: params.roomPaxCapacity,
                facilities: params.facilities || []
            };
            
            const response = await hotelService.searchHotels({
                locationId: !boundsData.isUserPan ? searchParams.get('locationId') : null,
                geo: boundsData.bounds,
                zoom: boundsData.zoom,
                page: 0,
                size: 100,
                filters: filtersBody,
                searchCriteria: {
                    checkin: params._checkin,
                    checkout: params._checkout,
                    nationality: searchParams.get('nationality') || 'TR',
                    rooms: roomState
                },
                signal: controller.signal
            });

            if (response && response.data) {
                const { content } = response.data;
                const filtersData = response.filters || response.data.filters;
                
                if (filtersData) {
                    setDynamicFilters(filtersData);
                }

                // Extract location names from breadcrumbs
                const newLocationNames = {};
                (content || []).forEach(hotel => {
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

                const mappedHotels = (content || []).map(mapApiHotelToModel);
                
                // Add jitter for identical coordinates
                const coordinateMap = new Map();
                const jitteredHotels = mappedHotels.filter(h => h.lat && h.lng).map(hotel => {
                    const coordKey = `${hotel.lat.toFixed(4)}_${hotel.lng.toFixed(4)}`;
                    const count = coordinateMap.get(coordKey) || 0;
                    coordinateMap.set(coordKey, count + 1);
                    
                    if (count > 0) {
                        const offsetMultiplier = 0.00015;
                        const angle = count * Math.PI * 0.4;
                        let radius = offsetMultiplier * Math.ceil(count / 5);
                        
                        return {
                            ...hotel,
                            lat: hotel.lat + radius * Math.cos(angle),
                            lng: hotel.lng + radius * Math.sin(angle)
                        };
                    }
                    return hotel;
                });

                setHotels(jitteredHotels);
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Map search request aborted');
            } else {
                console.error('Failed to fetch hotels for map:', error);
            }
        } finally {
            if (abortControllerRef.current === controller) {
                setIsLoadingHotels(false);
            }
        }
    }, [mapApiHotelToModel, searchParams, getSearchFilters]);

    // Trigger fetch on bounds change or search parameter change
    useEffect(() => {
        if (currentBounds) {
            fetchHotels(currentBounds);
        }
    }, [currentBounds, fetchHotels]);

    // Metadata fetching effects (copied from HotelListing.jsx strategy)
    useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.locationId) return;
        const missingLocIds = dynamicFilters.locationId.map(f => f.value).filter(id => !locationNames[id]);
        if (missingLocIds.length === 0) return;

        let isMounted = true;
        const fetchMissingNames = async () => {
            const newNames = {};
            await Promise.allSettled(missingLocIds.map(async (id) => {
                try {
                    const data = await locationService.fetchBreadcrumb(id);
                    const crumbs = (data && data.data && Array.isArray(data.data)) ? data.data : (data?.breadcrumbs || []);
                    crumbs.forEach(crumb => {
                        if (crumb.locationId && crumb.name) {
                            newNames[crumb.locationId] = crumb.name.defaultName || crumb.name.translations?.en || crumb.name.translations?.tr;
                        }
                    });
                } catch (error) {}
            }));
            if (isMounted && Object.keys(newNames).length > 0) {
                setLocationNames(prev => ({ ...prev, ...newNames }));
            }
        };
        fetchMissingNames();
        return () => { isMounted = false; };
    }, [dynamicFilters, locationNames]);

    useEffect(() => {
        if (!dynamicFilters || !dynamicFilters.hotelFacilityIds) return;
        const missingFacIds = dynamicFilters.hotelFacilityIds.map(f => f.value).filter(id => !facilityNames[id]);
        if (missingFacIds.length === 0) return;

        let isMounted = true;
        const fetchMissingNames = async () => {
            try {
                const data = await hotelService.fetchFacilityNames(missingFacIds);
                if (isMounted && data && Array.isArray(data)) {
                    const newNames = {};
                    data.forEach(fac => {
                        newNames[fac.facilityId] = fac.nameEn || fac.nameTr || fac.nameDe || `Facility ${fac.facilityId}`;
                    });
                    if (Object.keys(newNames).length > 0) setFacilityNames(prev => ({ ...prev, ...newNames }));
                }
            } catch (error) {}
        };
        fetchMissingNames();
        return () => { isMounted = false; };
    }, [dynamicFilters, facilityNames]);
    

    const filteredHotels = hotels.filter(hotel => {
        // Client-side geo bounding box filter (backend also filters, but this ensures map consistency)
        let inBounds = true;
        if (currentBounds && currentBounds.bounds && hotel.lat && hotel.lng) {
            const { topLeft, bottomRight } = currentBounds.bounds;
            inBounds = (
                hotel.lat <= topLeft.lat && 
                hotel.lat >= bottomRight.lat && 
                hotel.lng >= topLeft.lon && 
                hotel.lng <= bottomRight.lon
            );
        }
        return inBounds;
    });

    // Sync breadcrumbs and location context with map center during user movement
    useEffect(() => {
        if (!map || filteredHotels.length === 0 || !isUserPanRef.current) return;

        const syncBreadcrumbWithCenter = () => {
            try {
                const center = map.getCenter();
                let closestHotel = null;
                let minDistance = Infinity;

                filteredHotels.forEach(hotel => {
                    if (hotel.lat && hotel.lng) {
                        const dist = map.distance(center, [hotel.lat, hotel.lng]);
                        if (dist < minDistance) {
                            minDistance = dist;
                            closestHotel = hotel;
                        }
                    }
                });

                if (closestHotel && closestHotel.locationBreadcrumbs && closestHotel.locationBreadcrumbs.length > 0) {
                    const breadcrumbs = closestHotel.locationBreadcrumbs;
                    const lastCrumb = breadcrumbs[breadcrumbs.length - 1];
                    
                    if (lastCrumb && lastCrumb.locationId) {
                        // 1. Update Breadcrumb State (UI only, avoids re-fetching)
                        setBreadcrumbData({
                            locationId: lastCrumb.locationId,
                            breadcrumbs: breadcrumbs,
                            locationType: lastCrumb.locationType,
                            name: lastCrumb.name
                        });

                        // 2. Update URL silently 
                        const currentLocId = searchParams.get('locationId');
                        if (currentLocId !== String(lastCrumb.locationId)) {
                            const newParams = new URLSearchParams(searchParams);
                            newParams.set('locationId', lastCrumb.locationId);
                            
                            // Optional: Update query 'q' to keep HeaderSearch in sync
                            const enName = lastCrumb.name?.translations?.en || lastCrumb.name?.defaultName;
                            if (enName) {
                                newParams.set('q', enName);
                            }
                            
                            setSearchParams(newParams, { replace: true });
                        }
                    }
                }
            } catch (err) {
                console.warn('Breadcrumb sync failed:', err);
            }
        };

        // Debounce update to avoid excessive URL/state changes while panning
        const timer = setTimeout(syncBreadcrumbWithCenter, 600);
        return () => clearTimeout(timer);
    }, [filteredHotels, map, searchParams, setSearchParams]);

    const handleHotelSelect = (hotel) => {
        setSelectedHotel(hotel);
        if (!isSidebarOpen) setIsSidebarOpen(true);
        const element = document.getElementById(`hotel-card-${hotel.id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleZoomIn = () => {
        if (map) map.zoomIn();
    };

    const handleZoomOut = () => {
        if (map) map.zoomOut();
    };

    const handleLocate = () => {
        if (map) {
            map.locate({ setView: true, maxZoom: 16 });
            map.on('locationfound', (e) => {
                L.marker(e.latlng).addTo(map)
                    .bindPopup("You are here")
                    .openPopup();
            });
        }
    };

    // Get location name from breadcrumb data or query parameter
    let locationName = '';
    
    if (breadcrumbData && breadcrumbData.name) {
        locationName = breadcrumbData.name.translations?.en || breadcrumbData.name.defaultName || '';
    }
    
    if (!locationName) {
        const queryLocation = searchParams.get('q');
        locationName = queryLocation
            ? queryLocation.split(',')[0].trim()
            : 'Explore';
    }

    if (isUserPanRef.current && !breadcrumbData) {
        if (filteredHotels.length > 0) {
            const firstLocation = filteredHotels[0].location;
            if (Array.isArray(firstLocation)) {
                // If it's an array like ['Turkey', 'Ankara', 'Cankaya']
                locationName = firstLocation[firstLocation.length > 1 ? firstLocation.length - 1 : 0];
            } else if (typeof firstLocation === 'string' && firstLocation !== 'Unknown Location') {
                // If it's a string, attempt to split by common separators or use as is
                const parts = firstLocation.split(/[/,-]/).map(p => p.trim()).filter(Boolean);
                locationName = parts.length > 0 ? parts[parts.length - 1] : firstLocation;
            } else {
                locationName = 'Map Area';
            }
        } else {
            locationName = 'Map Area';
        }
    }

    return (
        <div className="flex flex-col h-screen bg-white dark:bg-background-dark overflow-hidden font-sans">
            <Header />

            {/* Breadcrumbs Section - matches HotelListing.jsx structure */}
            <div className="max-w-[1440px] mx-auto w-full px-6 lg:px-20 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Breadcrumbs
                        locationId={searchParams.get('locationId') || '174737'}
                        initialData={breadcrumbData}
                    />
                    <div className="flex items-center gap-6">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                            </div>
                            Back to List
                        </button>
                        <Link
                            to="/"
                            className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-lg">arrow_back</span>
                            </div>
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Aside: Hotel List Sidebar */}
                <aside className={`absolute lg:relative z-30 h-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-2xl border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-500 ease-in-out shadow-2xl overflow-hidden ${isSidebarOpen
                    ? 'w-full md:w-[420px] xl:w-[480px] translate-x-0 opacity-100'
                    : 'w-0 -translate-x-full opacity-0 pointer-events-none'
                    }`}>
                    <div className="h-full flex flex-col w-[420px] xl:w-[480px]">
                        <div className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <h1 className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white uppercase leading-none">{locationName}</h1>
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-2">
                                        {isLoadingHotels ? 'Searching...' : `${filteredHotels.length} Properties in this area`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsFilterModalOpen(true)}
                                        className="px-5 py-3 flex items-center gap-2 rounded-2xl bg-[#137fec] text-white shadow-lg shadow-[#137fec]/20 hover:scale-105 active:scale-95 transition-all group"
                                    >
                                        <span className="material-symbols-outlined text-[20px] font-black uppercase">tune</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                                    </button>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="size-12 lg:hidden flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    >
                                        <span className="material-symbols-outlined font-black">close</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                            {filteredHotels.map((hotel) => (
                                <Link
                                    to={`/hotel/${hotel.id}?${searchParams.toString()}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id={`hotel-card-${hotel.id}`}
                                    key={hotel.id}
                                    onMouseEnter={() => handleHover(hotel)}
                                    onMouseLeave={() => handleHover(null)}
                                    onClick={(e) => {
                                        // Still allow hotel selection on map but don't prevent navigation
                                        handleHotelSelect(hotel);
                                    }}
                                    className={`group flex gap-5 p-5 rounded-[32px] border-2 transition-all duration-300 cursor-pointer relative overflow-hidden backdrop-blur-md ${selectedHotel?.id === hotel.id
                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-2xl shadow-primary/10'
                                        : 'border-transparent bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900 shadow-sm hover:shadow-xl hover:border-white dark:hover:border-slate-800'
                                        }`}
                                >
                                    <div className="w-40 h-32 rounded-[24px] overflow-hidden shrink-0 relative">
                                        <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" src={hotel.image} alt={hotel.name} />

                                        {/* Modern List-Style Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                                            {hotel.badges?.map((badge, idx) => (
                                                <div key={idx} className={`${badge.color} text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 backdrop-blur-sm border border-white/10`}>
                                                    {badge.type === 'featured' && <span className="material-symbols-outlined text-[12px] fill-1">workspace_premium</span>}
                                                    {badge.type === 'opportunity' && <span className="material-symbols-outlined text-[12px] fill-1">local_fire_department</span>}
                                                    {badge.type === 'discount' && <span className="material-symbols-outlined text-[12px] fill-1">sell</span>}
                                                    {badge.type === 'popular' && <span className="material-symbols-outlined text-[12px] fill-1">trending_up</span>}
                                                    {badge.type === 'exclusive' && <span className="material-symbols-outlined text-[12px] fill-1">verified</span>}
                                                    {badge.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                                        <div>
                                            <div className="flex items-center gap-1 mb-1.5 opacity-60">
                                                {[...Array(hotel.stars || 0)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-[10px] text-amber-400 fill-1">star</span>
                                                ))}
                                            </div>
                                            <h3 className="font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight truncate group-hover:text-primary transition-colors text-sm">{hotel.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1.5 uppercase tracking-widest">
                                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                {hotel.location}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2.5 py-1.5 rounded-xl bg-[#137fec]/10 dark:bg-[#137fec]/20 flex items-center justify-center text-[#137fec] font-black text-[10px]">
                                                    {hotel.rating}
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Rating</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-[#137fec] leading-none tracking-tighter">${hotel.price}</p>
                                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Starting At</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Section: Leaflet Map */}
                <section className="flex-1 min-h-0 relative bg-slate-100 dark:bg-[#0c1622] overflow-hidden">
                    {hasInitialDataLoaded ? (
                        <div className="w-full h-full relative">
                            <MapContainer
                                key="main-travel-map"
                                center={[breadcrumbData?.geoCoordinate?.lat || 40.944, breadcrumbData?.geoCoordinate?.lon || 33.622]}
                                zoom={10}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                            >
                                <MapInstanceCapture setMap={setMap} />
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                />

                                <MapBoundsListener 
                                    onBoundsChange={setCurrentBounds} 
                                    isUserPanRef={isUserPanRef}
                                />

                                <MapController selectedHotel={selectedHotel} />

                                {filteredHotels.map((hotel) => (
                                    <CustomPriceMarker
                                        key={hotel.id}
                                        hotel={hotel}
                                        isSelected={selectedHotel?.id === hotel.id}
                                        isHovered={hoveredHotel?.id === hotel.id}
                                        onSelect={handleHotelSelect}
                                        onHover={handleHover}
                                        searchParams={searchParams}
                                    />
                                ))}
                            </MapContainer>

                            {/* Subsequent Data Loading Overlay */}
                            {isDataLoading && (
                                <div className="absolute inset-0 z-[2000] bg-white/20 dark:bg-black/20 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
                                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 py-4 rounded-[20px] shadow-2xl border border-white/20 flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Updating Orbit...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-[#0c1622]">
                            <div className="flex flex-col items-center gap-4 text-center p-6">
                                <div className="w-12 h-12 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Preparing travel map...</p>
                            </div>
                        </div>
                    )}

                    {/* Glass Hover Preview Card */}
                    {hoveredHotel && (
                        <div
                            onMouseEnter={() => handleHover(hoveredHotel)}
                            onMouseLeave={() => handleHover(null)}
                            className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_96px_-16px_rgba(0,0,0,0.4)] border border-white/20 dark:border-slate-800 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4"
                        >
                            <Link
                                to={`/hotel/${hoveredHotel.id}?${searchParams.toString()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="h-40 relative">
                                    <img className="w-full h-full object-cover" src={hoveredHotel.image} alt="" />
                                    <div className="absolute top-4 right-4 bg-[#137fec] px-3 py-1.5 rounded-2xl text-[10px] font-black text-white shadow-xl shadow-[#137fec]/30 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-[14px]">star</span>
                                        {hoveredHotel.rating}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h4 className="font-black text-base uppercase tracking-tight text-slate-900 dark:text-white truncate">{hoveredHotel.name}</h4>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-1 opacity-60">
                                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{hoveredHotel.location}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black text-[#137fec]">${hoveredHotel.price}<span className="text-[10px] text-slate-400 lowercase ml-1 font-bold">/nt</span></span>
                                        </div>
                                    </div>

                                    {/* Amenities in Map Preview */}
                                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                                        {hoveredHotel.amenities.slice(0, 5).map((amenity, idx) => (
                                            <Tooltip key={idx} text={amenity.label} position="top">
                                                <div className="size-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                                                    <span className="material-symbols-outlined text-base">{amenity.icon}</span>
                                                </div>
                                            </Tooltip>
                                        ))}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    )}

                    {/* Map Controls (Glass) */}
                    <div className="absolute right-8 top-8 z-[1000] flex flex-col gap-4">
                        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col">
                            <button onClick={handleZoomIn} className="p-5 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 transition-all border-b border-slate-100/10 active:scale-95">
                                <span className="material-symbols-outlined font-black">add</span>
                            </button>
                            <button onClick={handleZoomOut} className="p-5 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 transition-all active:scale-95">
                                <span className="material-symbols-outlined font-black">remove</span>
                            </button>
                        </div>
                        <button onClick={handleLocate} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-[24px] shadow-2xl border border-white/20 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary active:scale-95 transition-all">
                            <span className="material-symbols-outlined font-black">near_me</span>
                        </button>

                        {/* Navigation Controls */}
                        <div className="flex flex-col gap-3 mt-4">
                            <button
                                onClick={handleBackToList}
                                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-[20px] shadow-xl border border-white/20 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-95 transition-all group flex items-center justify-center relative"
                            >
                                <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>

                                {/* Modern Tooltip */}
                                <div className="absolute right-full mr-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none shadow-xl z-50">
                                    Back to List
                                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                            </button>

                            <a
                                href="/"
                                className="bg-primary/90 backdrop-blur-xl p-4 rounded-[20px] shadow-xl shadow-primary/30 border border-white/20 text-white hover:bg-primary active:scale-95 transition-all group flex items-center justify-center relative"
                            >
                                <span className="material-symbols-outlined font-black group-hover:rotate-12 transition-transform">grid_view</span>

                                {/* Modern Tooltip */}
                                <div className="absolute right-full mr-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all pointer-events-none shadow-xl z-50">
                                    Dashboard
                                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Sidebar Toggle Action Bar */}
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 group">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="bg-slate-900 dark:bg-slate-900/90 backdrop-blur-xl text-white px-10 py-5 rounded-[30px] font-black uppercase text-xs tracking-[0.2em] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] flex items-center gap-4 hover:scale-105 active:scale-95 transition-all border border-white/10"
                        >
                            <span className="material-symbols-outlined text-xl transition-transform group-hover:rotate-12">
                                {isSidebarOpen ? 'close_fullscreen' : 'list'}
                            </span>
                            {isSidebarOpen ? 'Hide List View' : 'Show List View'}
                        </button>
                    </div>

                    {/* Sub branding Overlay */}
                    <div className="absolute bottom-10 right-10 z-[1000] opacity-30 pointer-events-none hidden md:block">
                        <div className="flex flex-col items-end gap-1">
                            <span className="font-black uppercase tracking-[0.6em] text-[10px] text-slate-500">Travel of Globe</span>
                            <span className="font-bold text-[8px] text-slate-400 uppercase tracking-widest">Elite Map Explorer v1.2</span>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modals */}
            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                filters={dynamicFilters}
                locationNames={locationNames}
                facilityNames={facilityNames}
            />
        </div >
    );
};

export default MapView;
