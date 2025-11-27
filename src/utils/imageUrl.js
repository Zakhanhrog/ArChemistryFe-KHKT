import { getApiBaseUrl } from './config';

/**
 * Normalizes image URLs to ensure they are absolute URLs.
 * Handles both relative URLs (for backward compatibility) and absolute URLs.
 * 
 * @param {string|null|undefined} url - The image URL (can be relative or absolute)
 * @returns {string|null} - The normalized absolute URL, or null if input is invalid
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  const trimmedUrl = url.trim();

  // If already an absolute URL (starts with http:// or https://), return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // If it's a relative URL (starts with /), convert to absolute URL
  if (trimmedUrl.startsWith('/')) {
    const apiBaseUrl = getApiBaseUrl();
    // Remove trailing slash from base URL if present
    const baseUrl = apiBaseUrl.replace(/\/$/, '');
    return `${baseUrl}${trimmedUrl}`;
  }

  // If it doesn't start with /, assume it's a relative path and prepend /
  const apiBaseUrl = getApiBaseUrl();
  const baseUrl = apiBaseUrl.replace(/\/$/, '');
  return `${baseUrl}/${trimmedUrl}`;
};

