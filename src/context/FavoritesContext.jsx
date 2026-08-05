import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { favoriteService } from '../services/favoriteService';

const FavoritesContext = createContext(null);

export const FavoritesProvider = ({ children }) => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState([]);
    const [activeHotelIds, setActiveHotelIds] = useState(new Set());

    // Determine user key for localStorage fallback
    const userStorageKey = useMemo(() => {
        if (!user) return 'b2b_favorites_guest';
        const identifier = user.id || user.userId || user.email || 'guest';
        return `b2b_favorites_${identifier}`;
    }, [user]);

    // Load active favorited hotel IDs from backend (lightweight call)
    const loadActiveHotelIds = useCallback(async () => {
        try {
            const ids = await favoriteService.getActiveHotelIds();
            if (Array.isArray(ids)) {
                const idSet = new Set(ids.map(id => String(id)));
                setActiveHotelIds(idSet);
                localStorage.setItem(userStorageKey, JSON.stringify(Array.from(idSet)));
                return;
            }
        } catch (e) {
            console.warn('Backend activeHotelIds unavailable, loading from localStorage:', e);
        }

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
        } catch (e) {
            console.error('Failed to parse favorites from localStorage:', e);
        }
        setActiveHotelIds(new Set());
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
