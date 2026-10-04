/**
 * Central Environment Configuration for b2b-frontend
 * 
 * Available modes:
 * - Localhost:  npm run local    (mode: localhost  -> http://localhost:8000)
 * - Test:       npm run dev:test (mode: test       -> http://72.62.17.189:8000)
 * - Production: npm run build    (mode: production -> http://72.62.17.189:8000)
 */

export const ENV = {
    MODE: import.meta.env.MODE,
    IS_DEV: import.meta.env.DEV,
    IS_PROD: import.meta.env.PROD,
    APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development',
    API_GATEWAY_URL: (import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000').replace(/\/+$/, ''),
};

export default ENV;
