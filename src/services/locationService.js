// Re-export and adapt to canonical geographyService
import geographyService from './geographyService';

export const locationService = {
    fetchBreadcrumb: (locationId, lang = '') => geographyService.fetchBreadcrumb(locationId, lang),
    fetchLocationDetails: (locationId) => geographyService.fetchRegionDetails(locationId),
    listCountries: (signal) => geographyService.listCountries('', signal),
    listSubRegions: (locationId, signal) => geographyService.listSubRegions(locationId, '', signal)
};

export default locationService;
