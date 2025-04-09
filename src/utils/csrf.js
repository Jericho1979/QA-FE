import config from '../config';

// API base URL from config
const API_URL = config.API_URL;

// Store the CSRF token in memory
let csrfToken = null;

/**
 * Fetch a CSRF token from the server
 * @returns {Promise<string|null>} The CSRF token or null if the request fails
 */
export const fetchCSRFToken = async () => {
  try {
    // If we already have a token, return it
    if (csrfToken) {
      return csrfToken;
    }
    
    console.log('Fetching CSRF token from server...');
    
    // Otherwise, fetch a new token
    const response = await fetch(`${API_URL}/csrf-token`, {
      credentials: 'include', // Important for cookies
      cache: 'no-cache' // Prevent caching
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Failed to read error response');
      console.error(`CSRF token error: Status ${response.status}`, errorText);
      throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.csrfToken) {
      console.error('CSRF token missing from response:', data);
      throw new Error('CSRF token missing from server response');
    }
    
    csrfToken = data.csrfToken;
    console.log('CSRF token fetched successfully');
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

/**
 * Clear the stored CSRF token, forcing a new one to be fetched next time
 */
export const clearCSRFToken = () => {
  csrfToken = null;
  console.log('CSRF token cleared');
};

/**
 * Add a CSRF token to fetch options
 * @param {Object} options - The fetch options object
 * @returns {Promise<Object>} The updated fetch options with CSRF token
 */
export const addCSRFToken = async (options = {}) => {
  const token = await fetchCSRFToken();
  
  if (!token) {
    console.warn('No CSRF token available for request');
    return options;
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token
    }
  };
};

/**
 * Create a fetch wrapper that automatically adds CSRF tokens
 * @param {string} url - The URL to fetch
 * @param {Object} options - The fetch options
 * @returns {Promise<Response>} The fetch response
 */
export const fetchWithCSRF = async (url, options = {}) => {
  try {
    // Add CSRF token to options
    const csrfOptions = await addCSRFToken(options);
    
    // Always include credentials for cookies
    csrfOptions.credentials = 'include';
    
    return fetch(url, csrfOptions);
  } catch (error) {
    console.error(`fetchWithCSRF failed for ${url}:`, error);
    throw error;
  }
};

export default {
  fetchCSRFToken,
  clearCSRFToken,
  addCSRFToken,
  fetchWithCSRF
}; 