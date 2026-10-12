import apiClient from '../utils/apiClient';
import ENV from '../config/environment';

const API_BASE_URL = `${ENV.API_GATEWAY_URL}/b2b-backend/v1`;

const breadcrumbCache = new Map();

export const normalizeRegion = (item) => {
    if (!item) return item;
    const regId = item.regionId || (item.id ? String(item.id) : null);
    const displayName = typeof item.name === 'string'
        ? item.name
        : (item.name?.defaultName || item.nameFull || '');

    return {
        ...item,
        regionId: regId,
        id: regId,
        name: typeof item.name === 'object' && item.name !== null ? item.name : {
            defaultName: displayName,
            translations: item.names || { tr: displayName, en: displayName }
        },
        displayName,
        countryCode: (item.countryCode || item.countryIso2 || '').toUpperCase(),
        countryIso2: (item.countryCode || item.countryIso2 || '').toUpperCase()
    };
};

export const geographyService = {
    fetchBreadcrumb: async (regionId, lang = '') => {
        if (!regionId) return null;
        const cacheKey = `${regionId}:${lang}`;
        if (breadcrumbCache.has(cacheKey)) {
            return breadcrumbCache.get(cacheKey);
        }
        const promise = apiClient.get(`${API_BASE_URL}/geography/breadcrumb/${regionId}`, {
            params: { ...(lang && { lang }) }
        });
        breadcrumbCache.set(cacheKey, promise);

        try {
            const response = await promise;
            if (response && Array.isArray(response.breadcrumbs)) {
                response.breadcrumbs = response.breadcrumbs.map(normalizeRegion);
            }
            return response;
        } catch (e) {
            breadcrumbCache.delete(cacheKey);
            throw e;
        }
    },

    fetchRegionDetails: async (regionId) => {
        const response = await apiClient.get(`${API_BASE_URL}/geography/${regionId}`);
        return normalizeRegion(response);
    },

    listCountries: async (lang = '', signal) => {
        const response = await apiClient.get(`${API_BASE_URL}/geography/countries`, {
            params: { ...(lang && { lang }) },
            signal
        });
        const list = response?.regionList || response?.locationList || (Array.isArray(response) ? response : []);
        const normalizedList = list.map(normalizeRegion);
        return {
            ...response,
            regionList: normalizedList,
            locationList: normalizedList
        };
    },

    listSubRegions: async (parentId, lang = '', signal) => {
        if (!parentId) return { numberOfItems: 0, regionList: [], locationList: [] };
        const response = await apiClient.get(`${API_BASE_URL}/geography/sub-regions/${parentId}`, {
            params: { ...(lang && { lang }) },
            signal
        });
        const list = response?.regionList || response?.locationList || (Array.isArray(response) ? response : []);
        const normalizedList = list.map(normalizeRegion);
        return {
            ...response,
            regionList: normalizedList,
            locationList: normalizedList
        };
    },

    getAncestors: async (regionId) => {
        const response = await apiClient.get(`${API_BASE_URL}/geography/ancestors/${regionId}`);
        return Array.isArray(response) ? response.map(normalizeRegion) : [];
    }
};

export default geographyService;
