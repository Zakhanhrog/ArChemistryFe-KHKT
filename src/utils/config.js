/**
 * Configuration utilities
 * Centralized configuration for API base URL and other environment variables
 */

/**
 * Get API base URL from environment variable
 * Falls back to localhost:8080 for development
 */
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
};

/**
 * Get Google OAuth Client ID from environment variable
 */
export const getGoogleClientId = () => {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
};

