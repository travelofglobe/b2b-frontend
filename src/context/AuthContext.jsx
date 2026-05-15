import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../services/authService';

import { getTokenExpiration } from '../utils/tokenUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remainingSeconds, setRemainingSeconds] = useState(null);

    // Initial auth check - runs only once on mount
    useEffect(() => {
        const checkAuth = () => {
            if (authService.isAuthenticated()) {
                setUser(authService.getUser());
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // Session tracking - runs on mount
    useEffect(() => {
        const updateTimer = () => {
            const token = authService.getToken();
            if (!token) {
                setRemainingSeconds(null);
                return;
            }

            const expiration = getTokenExpiration(token);
            if (expiration) {
                const seconds = Math.floor((expiration.getTime() - Date.now()) / 1000);
                setRemainingSeconds(seconds > 0 ? seconds : 0);
            } else {
                setRemainingSeconds(null);
            }
        };

        // Initial timer check
        updateTimer();

        // Update every 1 second for accurate countdown
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []); 

    const login = useCallback(async (email, password) => {
        const data = await authService.login(email, password);
        setUser(authService.getUser());
        return data;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
    }, []);

    const renewSession = useCallback(async () => {
        try {
            await authService.refreshToken();
            // Force re-sync user/token state
            setUser(authService.getUser());
            return true;
        } catch (error) {
            console.error('Failed to renew session:', error);
            return false;
        }
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        remainingSeconds,
        renewSession
    }), [user, loading, login, logout, remainingSeconds, renewSession]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
