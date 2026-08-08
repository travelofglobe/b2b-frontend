import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { locationService } from '../services/locationService';

const Breadcrumbs = ({ locationId, onBreadcrumbsLoaded, initialData }) => {
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // If initialData is provided, use it and don't fetch
        if (initialData && initialData.breadcrumbs) {
            setBreadcrumbs(initialData.breadcrumbs);
            return;
        }

        if (!locationId) {
            setBreadcrumbs([]);
            return;
        }

        const controller = new AbortController();

        const fetchBreadcrumbs = async () => {
            setLoading(true);
            try {
                const data = await locationService.fetchBreadcrumb(locationId);
                if (controller.signal.aborted) return;

                if (data && data.breadcrumbs) {
                    setBreadcrumbs(data.breadcrumbs);
                    if (onBreadcrumbsLoaded) {
                        onBreadcrumbsLoaded(data);
                    }
                }
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error('Failed to fetch breadcrumbs:', error);
                setBreadcrumbs([]);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchBreadcrumbs();

        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationId]); // only re-fetch when locationId changes

    // Helper to get name with English translation preference
    const getName = (nameObj) => {
        if (!nameObj) return '';
        return nameObj.translations?.en || nameObj.defaultName || '';
    };

    // Dedicated icons per locationType or depth index
    const getLocationIcon = (crumb, index) => {
        const type = (crumb?.locationType || crumb?.type || '').toUpperCase();
        switch (type) {
            case 'COUNTRY':
                return 'public';
            case 'CITY':
            case 'PROVINCE':
            case 'STATE':
                return 'location_city';
            case 'DISTRICT':
                return 'grid_view';
            case 'TOWN':
            case 'VILLAGE':
                return 'holiday_village';
            case 'HOTEL':
                return 'hotel';
            case 'REGION':
            case 'AREA':
                return 'explore';
            default:
                if (index === 0) return 'public';
                if (index === 1) return 'location_city';
                return 'location_on';
        }
    };

    if (loading) {
        return (
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-400 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Home</span>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span>Loading...</span>
            </nav>
        );
    }

    if (!breadcrumbs || breadcrumbs.length === 0) {
        return (
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium">
                <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors group">
                    <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors">home</span>
                    <span>Home</span>
                </Link>
            </nav>
        );
    }

    // Handle breadcrumb click - navigate to that location
    const handleBreadcrumbClick = (crumb) => {
        const isMapPage = location.pathname.startsWith('/map');
        const searchParams = new URLSearchParams(location.search);

        // Update locationId to the clicked breadcrumb's locationId
        searchParams.set('locationId', crumb.locationId);

        // Add query parameter with location name for autocomplete and page title
        const name = getName(crumb.name);
        searchParams.set('q', name);

        // Build hierarchical slug starting from City (index 1) if possible
        const index = breadcrumbs.findIndex(c => c.locationId === crumb.locationId);
        let slug = name.toLowerCase();
        
        if (index > 0) {
            // Include segments from index 1 (City) up to the clicked index
            const pathSegments = breadcrumbs.slice(1, index + 1).map(c => getName(c.name).toLowerCase());
            if (pathSegments.length > 0) {
                slug = pathSegments.join('/');
            }
        }

        // Navigate to appropriate page type with updated locationId and query
        const basePath = isMapPage ? '/map' : '/hotels';

        if (isMapPage) {
            window.location.href = `${basePath}?${searchParams.toString()}`;
        } else {
            window.location.href = `${basePath}/${slug}?${searchParams.toString()}`;
        }
    };

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium max-w-full overflow-x-auto scrollbar-hide py-1">
            {/* Home Link */}
            <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors shrink-0 group"
            >
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-primary transition-colors">home</span>
                <span>Home</span>
            </Link>

            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const name = getName(crumb.name);
                const iconName = getLocationIcon(crumb, index);
                const isCountryAfterHome = index === 0 && (crumb.locationType === 'COUNTRY' || crumb.type === 'COUNTRY');

                return (
                    <React.Fragment key={crumb.locationId}>
                        <span className="text-slate-300 dark:text-slate-700 font-light select-none shrink-0">/</span>
                        {isLast ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 font-semibold text-xs shrink-0">
                                <span className="material-symbols-outlined text-[15px]">{iconName}</span>
                                <span>{name}</span>
                            </span>
                        ) : isCountryAfterHome ? (
                            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0">
                                <span className="material-symbols-outlined text-[15px] text-slate-400">{iconName}</span>
                                <span>{name}</span>
                            </span>
                        ) : (
                            <span
                                onClick={() => handleBreadcrumbClick(crumb)}
                                className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-primary cursor-pointer transition-colors shrink-0 group"
                            >
                                <span className="material-symbols-outlined text-[15px] text-slate-400 group-hover:text-primary transition-colors">{iconName}</span>
                                <span>{name}</span>
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;

