import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { agencyService } from '../services/agencyService';
import { currencyService } from '../services/currencyService';
import { financeService } from '../services/financeService';

import i18n from '../i18n';
import { getCountryCodeFromName, getUserCountryCode } from '../utils/geoUtils';
import { getTokenExpiration, isTokenExpired } from '../utils/tokenUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agencyCurrency, setAgencyCurrency] = useState(null);
    const [agencyType, setAgencyType] = useState(null);
    const [agencyInfo, setAgencyInfo] = useState(null);
    // Map of currency code -> symbol fetched from backend
    const [currencySymbolMap, setCurrencySymbolMap] = useState({});
    // My agency's credit limit data — refreshed every 5 minutes
    const [myLimit, setMyLimit] = useState(null);

    const isAutoRenewingRef = useRef(false);
    const myLimitIntervalRef = useRef(null);

    // Initial auth check - runs only once on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = authService.getToken();
            const refreshToken = localStorage.getItem('refreshToken');

            if (token && !isTokenExpired(token)) {
                setUser(authService.getUser());
                setLoading(false);
                return;
            }

            if (refreshToken && !isTokenExpired(refreshToken)) {
                try {
                    await authService.refreshToken();
                    setUser(authService.getUser());
                } catch (err) {
                    console.warn('Initial token refresh failed:', err);
                    setUser(null);
                } finally {
                    setLoading(false);
                }
                return;
            }

            if (token || refreshToken) {
                authService.logout();
            }
            setUser(null);
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
                    setAgencyInfo(res);
                    if (res.currency) {
                        setAgencyCurrency(res.currency);
                    }
                    if (res.agencyType) {
                        setAgencyType(res.agencyType);
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

    // Fetch my agency limit on login + refresh every 5 minutes
    useEffect(() => {
        if (!user) {
            setMyLimit(null);
            if (myLimitIntervalRef.current) {
                clearInterval(myLimitIntervalRef.current);
                myLimitIntervalRef.current = null;
            }
            return;
        }

        const fetchMyLimit = async () => {
            try {
                const res = await financeService.getMyLimit();
                if (res) setMyLimit(res);
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    console.error('Failed to fetch my limit:', err);
                }
            }
        };

        // Fetch immediately on login
        fetchMyLimit();

        // Then refresh every 5 minutes
        myLimitIntervalRef.current = setInterval(fetchMyLimit, 5 * 60 * 1000);

        return () => {
            if (myLimitIntervalRef.current) {
                clearInterval(myLimitIntervalRef.current);
                myLimitIntervalRef.current = null;
            }
        };
    }, [user]);

    // Session tracking & silent auto-renew token when near expiration (checked every 30s, non-rendering)
    useEffect(() => {
        const checkSilentRefresh = async () => {
            const token = authService.getToken();
            if (!token) return;

            const expiration = getTokenExpiration(token);
            if (expiration) {
                const seconds = Math.floor((expiration.getTime() - Date.now()) / 1000);

                // Auto refresh token silently when 5 minutes (300s) or less remain, if refresh token exists
                if (seconds <= 300 && localStorage.getItem('refreshToken') && !isAutoRenewingRef.current) {
                    isAutoRenewingRef.current = true;
                    try {
                        await authService.refreshToken();
                        setUser(authService.getUser());
                    } catch (err) {
                        console.error('Silent token auto-refresh failed:', err);
                    } finally {
                        isAutoRenewingRef.current = false;
                    }
                }
            }
        };

        // Initial check
        checkSilentRefresh();

        // Check every 30 seconds (low-frequency background check without triggering component re-renders)
        const interval = setInterval(checkSilentRefresh, 30000);

        return () => clearInterval(interval);
    }, []);

    const login = useCallback(async (email, password) => {
        // Clear agency cache so the new user's agency data is fetched fresh
        agencyService.clearMeCache();
        const data = await authService.login(email, password);
        setUser(authService.getUser());
        return data;
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem('b2b_post_login_redirect');
        agencyService.clearMeCache();
        authService.logout();
        setUser(null);
        setAgencyInfo(null);
        setAgencyCurrency(null);
        setAgencyType(null);
        setMyLimit(null);
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

    const refreshMyLimit = useCallback(async () => {
        try {
            const res = await financeService.getMyLimit();
            if (res) setMyLimit(res);
        } catch (err) {
            console.error('Failed to refresh my limit:', err);
        }
    }, []);

    const getRemainingSeconds = useCallback(() => {
        const token = authService.getToken();
        if (!token) return null;
        const expiration = getTokenExpiration(token);
        if (!expiration) return null;
        const sec = Math.floor((expiration.getTime() - Date.now()) / 1000);
        return sec > 0 ? sec : 0;
    }, []);

    const value = useMemo(() => ({
        user,
        loading,
        login,
        logout,
        agencyInfo,
        agencyCurrency,
        agencyType,
        currencySymbolMap,
        myLimit,
        refreshMyLimit,
        renewSession,
        getRemainingSeconds,
    }), [user, loading, login, logout, agencyInfo, agencyCurrency, agencyType, currencySymbolMap, myLimit, refreshMyLimit, renewSession, getRemainingSeconds]);

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
