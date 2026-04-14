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

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <Link className="text-slate-400 dark:text-slate-500 hover:text-primary text-sm font-medium" to="/">Home</Link>
                <span className="material-symbols-outlined text-slate-400 text-xs">chevron_right</span>
                <span className="text-slate-400 text-sm">Loading...</span>
            </div>
        );
    }

    if (!breadcrumbs || breadcrumbs.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <Link className="text-slate-400 dark:text-slate-500 hover:text-primary text-sm font-medium" to="/">Home</Link>
            </div>
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
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link className="text-slate-400 dark:text-slate-500 hover:text-primary text-sm font-medium" to="/">Home</Link>

            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const name = getName(crumb.name);
                const isCountryAfterHome = index === 0 && (crumb.locationType === 'COUNTRY' || crumb.type === 'COUNTRY');

                return (
                    <React.Fragment key={crumb.locationId}>
                        <span className="material-symbols-outlined text-slate-400 text-xs">chevron_right</span>
                        {isLast ? (
                            <span className="text-slate-900 dark:text-white text-sm font-semibold">{name}</span>
                        ) : isCountryAfterHome ? (
                            <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                                {name}
                            </span>
                        ) : (
                            <span
                                onClick={() => handleBreadcrumbClick(crumb)}
                                className="text-slate-400 dark:text-slate-500 hover:text-primary text-sm font-medium cursor-pointer"
                            >
                                {name}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default Breadcrumbs;

