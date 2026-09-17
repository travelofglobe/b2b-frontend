import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { favoriteService } from '../services/favoriteService';
import { hotelService } from '../services/hotelService';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [activeHotelIds, setActiveHotelIds] = useState(new Set());

    // Determine user key for localStorage fallback
    const userId = user?.id || user?.userId || user?.email || 'guest';
    const userStorageKey = useMemo(() => {
        if (!user) return 'b2b_favorites_guest';
        return `b2b_favorites_${userId}`;
    }, [user, userId]);

    const isLoadingRef = React.useRef(false);

    // Load active favorited hotel IDs from backend (lightweight call)
    const loadActiveHotelIds = useCallback(async () => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        try {
            // 1. Fetch active favorite hotel IDs (lightweight ID set for instant heart icons)
            const ids = await favoriteService.getActiveHotelIds();
            if (Array.isArray(ids)) {
                const idSet = new Set(ids.map(id => String(id)));
                setActiveHotelIds(idSet);
                localStorage.setItem(userStorageKey, JSON.stringify(Array.from(idSet)));
            }

            // 2. Fetch basic favorite items without triggering heavy hotel room pricing search
            try {
                const favData = await favoriteService.getFavorites(0, 50, '', '');
                let favItems = favData?.content || favData?.favoriteHotels || favData?.items || [];
                if (!favItems.length && Array.isArray(favData)) favItems = favData;

                if (favItems.length > 0) {
                    setFavorites(favItems.map(f => ({
                        ...f,
                        id: f.id || f.hotelId,
                        hotelId: f.hotelId || f.id,
                        name: f.hotelName || f.name || `Hotel #${f.hotelId || f.id}`,
                        image: f.hotelImage || f.image || f.images?.[0]?.url || '',
                        stars: f.starRating || f.stars || 0,
                        location: f.hotelAddress || f.location || ''
                    })));
                } else {
                    setFavorites([]);
                }
            } catch (err) {
                console.warn("Failed to load favorite items in context:", err);
            }
        } catch (e) {
            console.warn('Backend activeHotelIds unavailable, loading from localStorage:', e);
            // Fallback to localStorage
            try {
                const stored = localStorage.getItem(userStorageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        const idSet = new Set(parsed.map(item => String(typeof item === 'object' ? (item.hotelId || item.id) : item)));
                        setActiveHotelIds(idSet);
                        return;
                    }
                }
            } catch (storageErr) {
                console.error('Failed to parse favorites from localStorage:', storageErr);
            }
            setActiveHotelIds(new Set());
        } finally {
            isLoadingRef.current = false;
        }
    }, [userStorageKey]);

    useEffect(() => {
        loadActiveHotelIds();
    }, [loadActiveHotelIds]);

    const isFavorite = useCallback((hotelId) => {
        if (!hotelId) return false;
        return activeHotelIds.has(String(hotelId));
    }, [activeHotelIds]);

    const addFavorite = useCallback(async (hotel) => {
        if (!hotel) return;
        const idStr = String(hotel.hotelId || hotel.id || '');
        if (!idStr) return;

        // Optimistic UI update
        setActiveHotelIds(prev => new Set([...prev, idStr]));
        setFavorites(prev => {
            const exists = prev.find(f => String(f.hotelId || f.id) === idStr);
            if (exists) return prev;
            return [...prev, hotel];
        });

        try {
            await favoriteService.addFavorite({
                hotelId: Number(idStr)
            });
        } catch (e) {
            console.error('Failed to sync addFavorite with backend:', e);
        }
    }, []);

    const removeFavorite = useCallback(async (hotelId) => {
        if (!hotelId) return;
        const targetId = String(hotelId);

        // Optimistic UI update
        setActiveHotelIds(prev => {
            const next = new Set(prev);
            next.delete(targetId);
            return next;
        });
        setFavorites(prev => prev.filter(f => String(f.hotelId || f.id) !== targetId));

        try {
            await favoriteService.deleteByHotelId(Number(targetId));
        } catch (e) {
            console.error('Failed to sync removeFavorite with backend:', e);
        }
    }, []);

    const toggleFavorite = useCallback((hotel) => {
        if (!hotel) return;
        const targetId = String(hotel.hotelId || hotel.id || '');
        if (isFavorite(targetId)) {
            removeFavorite(targetId);
        } else {
            addFavorite(hotel);
        }
    }, [isFavorite, removeFavorite, addFavorite]);

    const value = useMemo(() => ({
        favorites,
        activeHotelIds,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        refreshFavorites: loadActiveHotelIds
    }), [favorites, activeHotelIds, isFavorite, addFavorite, removeFavorite, toggleFavorite, loadActiveHotelIds]);

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};

export default FavoritesContext;
