import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { locationService } from '../services/locationService';

const Breadcrumbs = ({ locationId, onBreadcrumbsLoaded }) => {
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const fetchBreadcrumbs = async () => {
            if (!locationId) {
                setBreadcrumbs([]);
                return;
            }

            setLoading(true);
            try {
                const data = await locationService.fetchBreadcrumb(locationId);

                // Extract breadcrumbs array from response
                // API returns breadcrumbs in correct order: Country → City → District → Town
                if (data && data.breadcrumbs) {
                    setBreadcrumbs(data.breadcrumbs);

                    // Call callback with full data if provided
                    if (onBreadcrumbsLoaded) {
                        onBreadcrumbsLoaded(data);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch breadcrumbs:', error);
                setBreadcrumbs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBreadcrumbs();
    }, [locationId, onBreadcrumbsLoaded]);

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

        // Navigate to appropriate page type with updated locationId and query
        const basePath = isMapPage ? '/map' : '/hotels';
        const slug = name.toLowerCase().replace(/ /g, '-');

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

                return (
                    <React.Fragment key={crumb.locationId}>
                        <span className="material-symbols-outlined text-slate-400 text-xs">chevron_right</span>
                        {isLast ? (
                            <span className="text-slate-900 dark:text-white text-sm font-semibold">{name}</span>
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

