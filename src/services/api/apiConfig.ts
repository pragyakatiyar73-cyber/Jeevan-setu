/**
 * 🌐 Central API Base Configuration
 * In local dev or unified deployments, defaults to relative ''
 * In Netlify deployments with external backend, reads from VITE_API_BASE_URL
 */
export const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || '';
