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

    // Load favorites from backend (with localStorage fallback)
    const refreshFavorites = useCallback(async () => {
        try {
            const res = await favoriteService.getFavorites(0, 100);
            if (res && res.content && Array.isArray(res.content)) {
                const formatted = res.content.map(item => ({
                    backendId: item.id,
                    hotelId: String(item.hotelId),
                    id: String(item.hotelId),
                    name: item.hotelName || `Hotel #${item.hotelId}`,
                    stars: item.stars || 4,
                    city: item.cityName || '',
                    country: item.countryName || '',
                    location: [item.cityName, item.countryName].filter(Boolean).join(', ') || 'N/A',
                    supplier: item.supplier || 'B2B System',
                    image: item.imageUrl || '',
                    status: item.status || 'ACTIVE',
                    userEmail: item.userEmail,
                    addedAt: item.updateDateTime || item.createDateTime || new Date().toISOString()
                }));
                setFavorites(formatted);
                setActiveHotelIds(new Set(formatted.filter(f => f.status === 'ACTIVE').map(f => String(f.hotelId))));
                localStorage.setItem(userStorageKey, JSON.stringify(formatted));
                return;
            }
        } catch (e) {
            console.warn('Backend favoriteService unavailable, loading from localStorage:', e);
        }

        // Fallback to localStorage
        try {
            const stored = localStorage.getItem(userStorageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setFavorites(parsed);
                    setActiveHotelIds(new Set(parsed.map(item => String(item.hotelId || item.id))));
                    return;
                }
            }
        } catch (e) {
            console.error('Failed to parse favorites from localStorage:', e);
        }
        setFavorites([]);
        setActiveHotelIds(new Set());
    }, [userStorageKey]);

    useEffect(() => {
        refreshFavorites();
    }, [refreshFavorites]);

    const isFavorite = useCallback((hotelId) => {
        if (!hotelId) return false;
        const targetId = String(hotelId);
        if (activeHotelIds.has(targetId)) return true;
        return favorites.some(item => (String(item.hotelId) === targetId || String(item.id) === targetId) && item.status !== 'PASSIVE' && item.status !== 'DELETED');
    }, [favorites, activeHotelIds]);

    const addFavorite = useCallback(async (hotel) => {
        if (!hotel) return;
        const idStr = String(hotel.hotelId || hotel.id || '');
        if (!idStr) return;

        const locationStr = hotel.location || '';
        const locationParts = locationStr ? locationStr.split(',').map(s => s.trim()) : [];
        const fallbackCity = locationParts.length > 0 ? locationParts[0] : '';
        const fallbackCountry = locationParts.length > 1 ? locationParts[locationParts.length - 1] : '';

        // Optimistic UI update
        const newFav = {
            hotelId: idStr,
            id: idStr,
            name: hotel.name || hotel.hotelName || 'Hotel',
            stars: hotel.stars || hotel.hotelStar?.star || 4,
            city: hotel.city || fallbackCity,
            country: hotel.country || fallbackCountry,
            location: locationStr || `${fallbackCity}${fallbackCountry ? ', ' + fallbackCountry : ''}`,
            supplier: hotel.supplier || hotel.provider || hotel.supplierName || 'B2B System',
            image: hotel.image || (Array.isArray(hotel.images) ? hotel.images[0] : '') || '',
            status: 'ACTIVE',
            addedAt: new Date().toISOString()
        };

        setFavorites(prev => [newFav, ...prev.filter(f => String(f.hotelId) !== idStr)]);
        setActiveHotelIds(prev => new Set([...prev, idStr]));

        try {
            await favoriteService.addFavorite({
                hotelId: Number(idStr),
                hotelName: newFav.name,
                cityName: newFav.city,
                countryName: newFav.country,
                stars: newFav.stars,
                imageUrl: newFav.image
            });
            refreshFavorites();
        } catch (e) {
            console.error('Failed to sync addFavorite with backend:', e);
        }
    }, [refreshFavorites]);

    const removeFavorite = useCallback(async (hotelId) => {
        if (!hotelId) return;
        const targetId = String(hotelId);

        // Optimistic UI update
        setFavorites(prev => prev.filter(item => String(item.hotelId) !== targetId && String(item.id) !== targetId));
        setActiveHotelIds(prev => {
            const next = new Set(prev);
            next.delete(targetId);
            return next;
        });

        try {
            await favoriteService.deleteByHotelId(Number(targetId));
            refreshFavorites();
        } catch (e) {
            console.error('Failed to sync removeFavorite with backend:', e);
        }
    }, [refreshFavorites]);

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
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        refreshFavorites
    }), [favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite, refreshFavorites]);

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
