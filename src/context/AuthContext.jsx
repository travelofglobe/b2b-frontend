import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../services/authService';
import { agencyService } from '../services/agencyService';
import { currencyService } from '../services/currencyService';

import i18n from '../i18n';
import { getCountryCodeFromName, getUserCountryCode } from '../utils/geoUtils';
import { getTokenExpiration } from '../utils/tokenUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [agencyCurrency, setAgencyCurrency] = useState(null);
    // Map of currency code -> symbol fetched from backend
    const [currencySymbolMap, setCurrencySymbolMap] = useState({});

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

    // Fetch currency list (code -> symbol map) once on mount
    useEffect(() => {
        const controller = new AbortController();
        currencyService.listActiveCurrencies(controller.signal)
            .then(list => {
                if (Array.isArray(list)) {
                    const map = {};
                    list.forEach(c => {
                        if (c.code && c.symbol) {
                            map[c.code] = c.symbol;
                        }
                    });
                    setCurrencySymbolMap(map);
                }
            })
            .catch(err => {
                if (err?.name !== 'AbortError') {
                    console.error('Failed to fetch currency list:', err);
                }
            });
        return () => controller.abort();
    }, []);

    // Fetch agency info (including currency) when user is authenticated
    useEffect(() => {
        if (!user) return;

        const controller = new AbortController();
        agencyService.getMe(controller.signal)
            .then(res => {
                if (res) {
                    if (res.currency) {
                        setAgencyCurrency(res.currency);
                    }

                    // Store sales channel (agency) country code
                    const countryCode = getCountryCodeFromName(res.countryName) || getUserCountryCode();
                    if (countryCode) {
                        localStorage.setItem('agency_country_code', countryCode);
                    }

                    // Auto-set language based on agency defaultLanguage (fallback to 'en')
                    const rawLang = res.defaultLanguage ? String(res.defaultLanguage).trim().toLowerCase() : 'en';
                    const targetLang = ['en', 'tr', 'ar', 'es', 'ru', 'zh', 'ja', 'fa', 'fr', 'it', 'el', 'pt'].includes(rawLang) ? rawLang : 'en';
                    
                    const isUserOverridden = localStorage.getItem('user_manual_lang_override');
                    if (!isUserOverridden) {
                        i18n.changeLanguage(targetLang);
                    }
                }
            })
            .catch(err => {
                if (err?.name !== 'AbortError') {
                    console.error('Failed to fetch agency currency:', err);
                }
            });

        return () => controller.abort();
    }, [user]);

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
        setAgencyCurrency(null);
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
        renewSession,
        agencyCurrency,
        currencySymbolMap
    }), [user, loading, login, logout, remainingSeconds, renewSession, agencyCurrency, currencySymbolMap]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Returns the currency symbol for the given code using the backend symbol map.
 * Falls back to the code itself if not found.
 * @param {string} code - Currency code (e.g. "EUR", "USD")
 * @param {Object} symbolMap - Map of code -> symbol from AuthContext
 * @returns {string}
 */
export const getCurrencySymbol = (code, symbolMap = {}) => {
    if (!code) return '';
    return symbolMap[code] || code;
};
