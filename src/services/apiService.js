// Import the configuration
import config from '../config';
import { fetchWithCSRF, clearCSRFToken } from '../utils/csrf';

// API base URL from config
const API_URL = config.API_URL;

/**
 * Replace localStorage token retrieval with empty function
 * As we are now using cookie-based authentication, we don't need to retrieve tokens
 * This function is kept for backward compatibility with existing code
 */
const getToken = () => {
  console.log('getToken: Using cookie-based authentication instead of tokens');
  return null; // Return null as we're not using token-based auth anymore
};

/**
 * Migration helper utility for components that still use direct fetch with localStorage token
 * This function is a drop-in replacement for components to transition to secure API calls
 * @param {string} url - The URL to fetch (can be a full URL or a path relative to API_URL)
 * @param {Object} options - The fetch options
 * @returns {Promise<any>} - The parsed API response
 */
export const migrateToSecureApiCall = async (url, options = {}) => {
  console.log('migrateToSecureApiCall: Converting to secure API call');
  
  // Format the URL to use API_URL if it's not a full URL
  const fullUrl = url.startsWith('http') ? url : url.startsWith('/api') 
    ? `${API_URL.replace('/api', '')}${url}` 
    : `${API_URL}/${url.replace(/^api\//, '')}`;
  
  console.log(`migrateToSecureApiCall: Using API_URL: ${fullUrl}`);
  
  // Remove the Authorization header if it exists (we're using cookies now)
  if (options.headers?.Authorization) {
    console.log('migrateToSecureApiCall: Removing Authorization header');
    const { Authorization, ...remainingHeaders } = options.headers;
    options.headers = remainingHeaders;
  }
  
  // Use apiRequest which includes CSRF protection and cookies
  return apiRequest(fullUrl, options);
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  console.log(`handleResponse: Processing response with status ${response.status}`);
  
  // Clone the response for error text extraction to avoid "already used" errors
  const responseClone = response.clone();
  
  // Check if the response is OK (status in the range 200-299)
  if (!response.ok) {
    console.error(`handleResponse: Error response with status ${response.status} ${response.statusText}`);
    
    // Try to parse the error response as JSON
    let errorData;
    let errorText;
    
    try {
      // First try to get the raw text for logging
      errorText = await responseClone.text();
      console.error(`handleResponse: Error response body: ${errorText}`);
      
      // Then try to parse as JSON if it looks like JSON
      if (errorText.trim().startsWith('{') || errorText.trim().startsWith('[')) {
        errorData = JSON.parse(errorText);
        console.error(`handleResponse: Parsed error data:`, errorData);
  } else {
        // If not JSON, create a simple error object
        errorData = { error: errorText || response.statusText };
      }
    } catch (e) {
      // If parsing fails, use the status text as the error message
      console.error(`handleResponse: Failed to parse error response: ${e.message}`);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    // Throw an error with the parsed error message
    throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
  }
  
  // For 204 No Content responses, return an empty object
  if (response.status === 204) {
    console.log(`handleResponse: No content (204) response, returning empty object`);
    return {};
  }
  
  try {
    // For all other successful responses, parse and return the JSON
    const data = await response.json();
    console.log(`handleResponse: Successfully parsed response data`);
    return data;
  } catch (jsonError) {
    console.error(`handleResponse: Error parsing JSON response: ${jsonError.message}`);
    throw new Error('Failed to parse response as JSON');
  }
};

// Authentication API calls
export const authService = {
  // Register a new user
  register: async (email, password, name) => {
    console.log('authService.register called with:', { email, password, nameProvided: !!name });
    
    // Create a properly formatted user data object for the server
    const userData = {
            email, 
            password, 
      name
    };
    
    return apiRequest(`${API_URL}/auth/register`, {
          method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  // Login user
  login: async (email, password) => {
    return apiRequest(`${API_URL}/auth/login`, {
        method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },
  
  // Logout user
  logout: async () => {
    // Clear CSRF token on logout
    console.log('authService: Logging out user, clearing CSRF token');
    clearCSRFToken();
    return apiRequest(`${API_URL}/auth/logout`, {
      method: 'POST'
    });
  },
  
  // Check if user is authenticated
  checkAuth: async () => {
    try {
      console.log('authService: Checking authentication status');
      const result = await apiRequest(`${API_URL}/auth/check`);
      console.log('authService: Authentication result:', result);
      return result;
    } catch (error) {
      console.error('authService: Authentication check failed:', error);
      return { authenticated: false };
    }
  },
  
  // Check if user is authenticated (synchronous version)
  isAuthenticated: () => {
    console.log('authService: isAuthenticated called (synchronous version)');
    // If using cookies, we assume the user might be authenticated
    // The actual verification will happen when making API calls
    return true;
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    try {
      console.log('authService: Fetching current user from server');
      
      // First try using the apiRequest function
      try {
        const data = await apiRequest(`${API_URL}/auth/check`);
        console.log('authService: User data received:', data);
        
        if (!data || !data.user) {
          console.warn('authService: No user data in auth check response:', data);
          throw new Error('No user data in response');
        }
        
        return data.user;
      } catch (apiError) {
        console.error('authService: API request failed:', apiError);
        
        // Fall back to direct fetch with credentials
        console.log('authService: Trying direct fetch with credentials');
        const response = await fetch(`${API_URL}/auth/check`, {
          credentials: 'include' // Important for cookies
        });
        
        console.log('authService: Direct fetch response status:', response.status);
        
        if (!response.ok) {
          console.error('authService: Direct fetch failed with status:', response.status);
          return null;
        }
        
        const fallbackData = await response.json();
        console.log('authService: Direct fetch data:', fallbackData);
        
        if (!fallbackData || !fallbackData.user) {
          console.warn('authService: No user data in direct fetch response');
          return null;
        }
        
        return fallbackData.user;
      }
    } catch (error) {
      console.error('authService: Error fetching user profile:', error);
      return null;
    }
  },
};

/**
 * Makes an API request with consistent error handling and authentication
 * @param {string} url - The API endpoint to request (can be relative to API_URL or a full URL)
 * @param {Object} options - The fetch options
 * @returns {Promise<any>} - The parsed API response
 */
const apiRequest = async (url, options = {}) => {
  // Set default headers if not provided
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Build the request options
  const requestOptions = {
    ...options,
    headers,
    credentials: 'include' // Always include credentials for cookies
  };
  
  // Format the full URL (handle both relative and absolute URLs)
  const fullUrl = url.startsWith('http') ? url : url.startsWith('/api') ? `${API_URL.replace('/api', '')}${url}` : url;
  
  // Log the request details for debugging
  console.log(`apiRequest: Making request to ${fullUrl}`, {
    method: options.method || 'GET',
    headers: Object.keys(headers)
  });
  
  // If there's a body, log it for debugging
  if (options.body) {
    try {
      // Try to parse the JSON string to check if it's valid
      const bodyContent = JSON.parse(options.body);
      console.log('apiRequest: Request body:', bodyContent);
      
      // Make sure the body is properly stringified
      requestOptions.body = JSON.stringify(bodyContent);
    } catch (e) {
      console.error('apiRequest: Error parsing request body JSON:', e);
      console.log('apiRequest: Raw body content:', options.body);
      
      // Keep the original body if it's not valid JSON
      requestOptions.body = options.body;
    }
    }
    
    try {
    // Skip CSRF for Firebase requests, which go to a different domain
    const skipCSRF = fullUrl.includes('firebase') || fullUrl.includes('firebaseapp.com');
    
    let response;
    if (skipCSRF) {
      console.log(`apiRequest: Skipping CSRF for Firebase/external request`);
      response = await fetch(fullUrl, requestOptions);
    } else {
      console.log(`apiRequest: Using fetchWithCSRF for request`);
      response = await fetchWithCSRF(fullUrl, requestOptions);
    }
    
    console.log(`apiRequest: Response received, status: ${response.status}`);
      
      if (!response.ok) {
      // Clone the response before reading it to prevent "already used" errors
      const responseClone = response.clone();
      // Log the error response for debugging
      let errorText = '';
      try {
        errorText = await responseClone.text();
        console.error(`apiRequest: Error response body: ${errorText}`);
      } catch (textError) {
        console.error(`apiRequest: Failed to read error response: ${textError}`);
      }
    }
    
    return handleResponse(response);
    } catch (error) {
    console.error(`apiRequest: Request failed: ${fullUrl}`, error);
    
    // Check if the error is a token expiration
    if (error.message?.includes('Token expired') || error.message?.includes('Invalid token')) {
      console.warn(`apiRequest: Authentication token error detected, clearing CSRF token`);
      // Clear the stored CSRF token when authentication fails
      clearCSRFToken();
    }
    
    throw error;
  }
};

// API functions for various endpoints
export const apiService = {
  // Users
  getUsers: () => apiRequest('/users'),
  createUser: (userData) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  updateUser: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  deleteUser: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE'
  }),
  
  // ... other existing API endpoints ...
};

// User management API calls
export const userService = {
  getAllUsers: async () => {
    return apiRequest(`${API_URL}/users`);
  },

  updateUserType: async (userId, newType) => {
    return apiRequest(`${API_URL}/users/${userId}/type`, {
      method: 'PUT',
      body: JSON.stringify({ userType: newType })
    });
  },

  deleteUser: async (userId) => {
    return apiRequest(`${API_URL}/users/${userId}`, {
      method: 'DELETE'
    });
  },

  updateUser: async (userId, userData) => {
    return apiRequest(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  createUser: async (userData) => {
    try {
      // Import Firebase auth dynamically
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();

      return apiRequest(`${API_URL}/users`, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
};

// Teacher recordings API calls
export const recordingsService = {
  // Get recordings for a teacher
  getTeacherRecordings: async (teacherEmail) => {
    return apiRequest(`${API_URL}/recordings/${encodeURIComponent(teacherEmail)}`);
  },
};

// Fetch teacher statistics
export const fetchTeacherStats = async (teacherId) => {
  try {
    console.log(`API Service: Fetching teacher stats for ${teacherId}`);
    
    // Get base username for potential retries with different formats
    let baseUsername = teacherId;
    if (baseUsername.includes('@')) {
      baseUsername = baseUsername.split('@')[0];
    }
    if (baseUsername.startsWith('t.')) {
      baseUsername = baseUsername.substring(2);
    }
    
    // Build alternate formats to try if the first request fails
    const formats = [
      teacherId, // Try the original format first
      `t.${baseUsername}@little-champions.com`,
      `t.${baseUsername}@rhet-corp.com`
    ];
    
    // Remove duplicates from formats array
    const uniqueFormats = [...new Set(formats)];
    console.log('Will try these teacher ID formats:', uniqueFormats);
    
    // Try each format until one works
    let response = null;
    let data = null;
    let lastError = null;
    
    for (const format of uniqueFormats) {
      try {
        // Use apiRequest instead of direct fetch
        const url = `teacher-stats/${encodeURIComponent(format)}`;
        console.log(`Making request to: ${url}`);
        
        data = await apiRequest(`${API_URL}/${url}`);
          console.log(`Success with format: ${format}`);
        response = true;
          break;
      } catch (fetchError) {
        console.error(`Error trying format ${format}:`, fetchError);
        lastError = fetchError.message;
      }
    }
    
    // If all formats failed, throw an error
    if (!response) {
      throw new Error(`All teacher ID formats failed: ${lastError}`);
    }
    
    console.log('Teacher stats API response:', data);
    
    // Ensure we have a valid data structure even if the API returns an empty response
    if (!data || typeof data !== 'object') {
      console.warn('API returned invalid data, using empty structure');
      return {
        teacherGrade: null,
        departmentAverage: "0.00",
        evaluationCount: 0,
        recordingsCount: 0,
        evaluationRate: 0,
        categoryScores: {},
        performanceTrend: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
        monthlyPerformance: {},
        recentEvaluations: []
      };
    }
    
    // Process the data to ensure consistent format
    const processedData = {
      ...data,
      // Ensure evaluationRate is a number
      evaluationRate: typeof data.evaluationRate === 'string' ? 
        parseFloat(data.evaluationRate) : 
        (data.evaluationRate || 0)
    };
    
    // Special handling for cases where we have evaluations but no evaluation rate
    if (processedData.evaluationCount > 0 && processedData.evaluationRate === 0) {
      console.log('Found evaluations but rate is 0, calculating rate');
      if (processedData.recordingsCount > 0) {
        processedData.evaluationRate = Math.round((processedData.evaluationCount / processedData.recordingsCount) * 100);
      } else {
        processedData.evaluationRate = 100; // If we have evaluations but no recordings, set to 100%
      }
      console.log('Calculated evaluation rate:', processedData.evaluationRate);
    }
    
    return processedData;
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    
    // Return a default structure instead of throwing to prevent UI errors
    return {
      teacherGrade: null,
      departmentAverage: "0.00",
      evaluationCount: 0,
      recordingsCount: 0,
      evaluationRate: 0,
      categoryScores: {},
      performanceTrend: [],
      strengths: [],
      weaknesses: [],
      recommendations: [],
      monthlyPerformance: {},
      recentEvaluations: []
    };
  }
};

// Fetch teacher evaluation history
export const fetchTeacherEvaluationHistory = async (teacherId) => {
  try {
    console.log(`API Service: Fetching evaluation history for ${teacherId}`);
    
    // Get base username for potential retries with different formats
    let baseUsername = teacherId;
    if (baseUsername.includes('@')) {
      baseUsername = baseUsername.split('@')[0];
    }
    if (baseUsername.startsWith('t.')) {
      baseUsername = baseUsername.substring(2);
    }
    
    // Build alternate formats to try if the first request fails
    const formats = [
      teacherId, // Try the original format first
      `t.${baseUsername}@little-champions.com`,
      `t.${baseUsername}@rhet-corp.com`
    ];
    
    // Remove duplicates from formats array
    const uniqueFormats = [...new Set(formats)];
    console.log('Will try these teacher ID formats for history:', uniqueFormats);
    
    // Try each format until one works
    let data = null;
    let lastError = null;
    
    for (const format of uniqueFormats) {
      try {
        const url = `teacher-evaluation-history/${encodeURIComponent(format)}`;
        console.log(`Making history request to: ${url}`);
        
        data = await apiRequest(`${API_URL}/${url}`);
          console.log(`History success with format: ${format}`);
        return data;
      } catch (fetchError) {
        console.error(`Error trying format ${format} for history:`, fetchError);
        lastError = fetchError.message;
      }
    }
    
    // If all formats failed, return empty array
    console.warn('All teacher ID formats failed for history:', lastError);
    return [];
  } catch (error) {
    console.error('Error fetching teacher evaluation history:', error);
    // Return empty array on error to prevent UI errors
    return [];
  }
};

// Fetch teacher category performance
export const fetchTeacherCategoryPerformance = async (teacherId) => {
  try {
    console.log(`API Service: Fetching category performance for ${teacherId}`);
    
    return await apiRequest(`${API_URL}/teacher-category-performance/${encodeURIComponent(teacherId)}`);
  } catch (error) {
    console.error('Error fetching teacher category performance:', error);
    // Return empty object on error to prevent UI errors
    return {};
  }
};

// Fetch teacher recordings
export const fetchTeacherRecordings = async (teacherId) => {
  try {
    console.log('Fetching recordings for teacher:', teacherId);
    
    // First attempt - use the specific teacher-recordings endpoint
    try {
      const data = await apiRequest(`${API_URL}/teacher-recordings/${encodeURIComponent(teacherId)}`);
      console.log('Teacher recordings API response:', data);
      return data;
    } catch (firstError) {
      console.error(`API error response from teacher-recordings endpoint:`, firstError);
      
      // If the first attempt fails, try the teachers/:id endpoint which includes recordings
      console.log('Trying alternative endpoint to fetch recordings');
      try {
        const teacherData = await apiRequest(`${API_URL}/teachers/${encodeURIComponent(teacherId)}`);
        console.log('Teacher data retrieved from alternative endpoint:', teacherData);
        
        if (teacherData.recordings && Array.isArray(teacherData.recordings)) {
          console.log(`Found ${teacherData.recordings.length} recordings in teacher data`);
          return teacherData.recordings;
        }
      } catch (secondError) {
        console.error(`Alternative endpoint also failed:`, secondError);
      
      // If both attempts fail, try the recordings endpoint with query parameter
      console.log('Trying recordings endpoint with teacherId as query parameter');
        try {
          const data = await apiRequest(`${API_URL}/recordings?teacherId=${encodeURIComponent(teacherId)}`);
          console.log('Teacher recordings API response from query parameter endpoint:', data);
          return data;
        } catch (thirdError) {
          console.error(`All recording endpoints failed.`, thirdError);
          return [];
        }
        }
        
      // If we got here, all attempts failed but didn't throw
        return [];
      }
  } catch (error) {
    console.error('Error fetching teacher recordings:', error);
    // Return empty array on error to prevent UI errors
    return [];
  }
};

// Fetch teacher latest grade
export const fetchTeacherLatestGrade = async (teacherId) => {
  try {
    console.log(`Fetching latest grade for ${teacherId}`);
    
    const data = await apiRequest(`${API_URL}/teacher-latest-grade/${encodeURIComponent(teacherId)}`);
    console.log('Latest grade API response:', data);
    return data;
  } catch (error) {
    console.error('Error fetching latest grade:', error);
    throw error;
  }
};

// Fetch teacher check
export const checkTeacherExists = async (teacherId) => {
  try {
    console.log(`API Service: Checking if teacher ${teacherId} exists`);
    
    // Log the exact URL to help with debugging
    const url = `${API_URL}/teacher-check/${encodeURIComponent(teacherId)}`;
    console.log(`Making request to: ${url}`);
    
    const data = await apiRequest(url);
    console.log('Teacher check API response:', data);
    return data;
  } catch (error) {
    console.error('Error checking teacher existence:', error);
    // Return default result on error
    return {
      exists: false,
      message: error.message
    };
  }
};

// Paginated API calls for teachers and recordings
export const paginatedService = {
  // Get a paginated list of teachers
  getTeachersPaginated: async (pageSize = 50, pageToken = null) => {
    try {
      let url = `${API_URL}/teachers-paginated?pageSize=${pageSize}`;
      
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }
      
      console.log(`Fetching paginated teachers: ${url}`);
      
      return await apiRequest(url);
    } catch (error) {
      console.error('Error fetching paginated teachers:', error);
      throw error;
    }
  },
  
  // Get a paginated list of recordings for a teacher
  getTeacherRecordingsPaginated: async (teacherId, pageSize = 50, pageToken = null) => {
    try {
      let url = `${API_URL}/recordings-paginated?teacherId=${encodeURIComponent(teacherId)}&pageSize=${pageSize}`;
      
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }
      
      console.log(`Fetching paginated recordings for teacher ${teacherId}: ${url}`);
      
      return await apiRequest(url);
    } catch (error) {
      console.error(`Error fetching paginated recordings for teacher ${teacherId}:`, error);
      throw error;
    }
  },
  
  // Get a teacher with paginated recordings
  getTeacherWithRecordingsPaginated: async (teacherId, pageSize = 50, pageToken = null) => {
    try {
      let url = `${API_URL}/teachers-paginated/${encodeURIComponent(teacherId)}?pageSize=${pageSize}`;
      
      if (pageToken) {
        url += `&pageToken=${encodeURIComponent(pageToken)}`;
      }
      
      console.log(`Fetching teacher ${teacherId} with paginated recordings: ${url}`);
      
      return await apiRequest(url);
    } catch (error) {
      console.error(`Error fetching teacher ${teacherId} with paginated recordings:`, error);
      throw error;
    }
  },

  // Helper function to fetch all pages of data (careful with large datasets)
  fetchAllPages: async (fetchFunction, initialParams = {}) => {
    let allItems = [];
    let nextPageToken = null;
    let currentPage = 1;
    
    try {
      do {
        console.log(`Fetching page ${currentPage}${nextPageToken ? ' with token ' + nextPageToken : ''}`);
        
        const params = { ...initialParams };
        if (nextPageToken) {
          params.pageToken = nextPageToken;
        }
        
        const response = await fetchFunction(params);
        
        if (!response || !response.items) {
          console.error('Invalid response format:', response);
          break;
        }
        
        allItems = [...allItems, ...response.items];
        nextPageToken = response.nextPageToken;
        currentPage++;
        
        // Add a small delay to prevent rate limiting
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } while (nextPageToken);
      
      console.log(`Fetched ${allItems.length} total items in ${currentPage-1} pages`);
      return allItems;
    } catch (error) {
      console.error('Error fetching all pages:', error);
      throw error;
    }
  }
};

// Video Markers API
export const markerService = {
  // Create a new marker
  createMarker: async (markerData) => {
    return apiRequest(`${API_URL}/markers`, {
        method: 'POST',
        body: JSON.stringify(markerData)
      });
  },
  
  // Get markers for a specific recording
  getMarkersByRecording: async (recordingId) => {
    return apiRequest(`${API_URL}/markers/recording/${recordingId}`);
  },
  
  // Get public amazing moments
  getPublicAmazingMoments: async (limit = 10) => {
    return apiRequest(`${API_URL}/markers/amazing?limit=${limit}`);
  },
  
  // Get all markers for a specific teacher
  getTeacherMarkers: async (teacherId) => {
    return apiRequest(`${API_URL}/markers/teacher/${encodeURIComponent(teacherId)}`);
  },
  
  // Update a marker
  updateMarker: async (id, markerData) => {
    return apiRequest(`${API_URL}/markers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(markerData)
      });
  },
  
  // Delete a marker
  deleteMarker: async (id) => {
    return apiRequest(`${API_URL}/markers/${id}`, {
      method: 'DELETE'
    });
  }
};

// Add the new service for teacher grades
const teacherGradesService = {
  // Fetch all teacher grades
  async getAllTeacherGrades() {
    try {
      const data = await apiRequest(`${API_URL}/teacher-grades`);
      console.log('Teacher grades API response:', data);
      
      // Process and return the data
      if (Array.isArray(data)) {
        // Map grades to include both regular and trial class grades
        return data.map(grade => ({
          ...grade,
          // Use grade value if present, otherwise use tc_grades
          grade: grade.grade !== null ? parseFloat(grade.grade) : (grade.tc_grades !== null ? parseFloat(grade.tc_grades) : null)
        }));
      }
      return data;
    } catch (error) {
      console.error('Error fetching teacher grades:', error);
      throw error;
    }
  },

  // Fetch grades for a specific teacher
  async getTeacherGradeById(teacherId) {
    // Use the correct endpoint structure /api/teachers/:id/grade
    return apiRequest(`${API_URL}/teachers/${encodeURIComponent(teacherId)}/grade`);
  },

  // Create a new teacher grade - always creates a new record
  async saveTeacherGrade(gradeData) {
    const { teacher_id, ...data } = gradeData;
    
    // Add missing required fields if not provided
    const enrichedData = {
      ...data,
      // Ensure month and year are provided
      month: data.month || (new Date().getMonth() + 1),
      year: data.year || new Date().getFullYear(),
      // Convert qa_comments to comments if needed
      comments: data.qa_comments || data.comments || '',
      // Ensure evaluation_ids is an array
      evaluation_ids: Array.isArray(data.evaluation_ids) ? data.evaluation_ids : 
        (data.evaluation_ids ? [data.evaluation_ids] : []),
    };
    
    console.log('Sending grade data:', enrichedData);
    
    // Create new grade - use the endpoint that works
    const teacherId = teacher_id || enrichedData.teacher_id;
    if (!teacherId) {
      throw new Error('teacher_id is required');
    }
    
    return apiRequest(`${API_URL}/teachers/${encodeURIComponent(teacherId)}/grade`, {
      method: 'POST',
      body: JSON.stringify(enrichedData)
    });
  },

  // Delete a teacher grade
  async deleteTeacherGrade(teacherId) {
    return apiRequest(`${API_URL}/teacher-grades/${encodeURIComponent(teacherId)}`, {
      method: 'DELETE'
    });
  }
};

/**
 * Get a URL for playing a video recording
 * @param {string} teacherEmail - The teacher's email
 * @param {string} fileName - The name of the video file
 * @param {string} fileId - Optional file ID for cloud storage
 * @returns {string} - The URL to play the video
 */
const getVideoPlaybackUrl = (teacherEmail, fileName, fileId) => {
  console.log('getVideoPlaybackUrl called with:', { teacherEmail, fileName, fileId });
  
  // If we have a fileId, we should use a different URL format for cloud storage
  if (fileId) {
    return `${config.video.baseDriveStreamUrl}/${encodeURIComponent(fileId)}`;
  }
  
  // Otherwise use the local streaming URL
  const teacherId = teacherEmail.split('@')[0];
  return `${config.video.baseStreamUrl}/${encodeURIComponent(teacherId)}/${encodeURIComponent(fileName)}`;
};

/**
 * Get a URL for downloading a video recording
 * @param {string} teacherEmail - The teacher's email
 * @param {string} fileName - The name of the video file
 * @param {string} fileId - Optional file ID for cloud storage
 * @returns {string} - The URL to download the video
 */
const getVideoDownloadUrl = (teacherEmail, fileName, fileId) => {
  console.log('getVideoDownloadUrl called with:', { teacherEmail, fileName, fileId });
  
  // If we have a fileId, we should use a different URL format for cloud storage
  if (fileId) {
    return `${config.video.baseDriveDownloadUrl}/${encodeURIComponent(fileId)}`;
  }
  
  // Otherwise use the local download URL
  const teacherId = teacherEmail.split('@')[0];
  return `${config.video.baseDownloadUrl}/${encodeURIComponent(teacherId)}/${encodeURIComponent(fileName)}`;
};

// Comment replies service
const commentRepliesService = {
  // Get all comment replies
  getAllCommentReplies: async () => {
    return apiRequest(`${API_URL}/all-comment-replies`);
  },
  
  // Get comment replies for a specific evaluation
  getCommentRepliesByEvaluation: async (evaluationId) => {
    return apiRequest(`${API_URL}/comment-replies/${evaluationId}`);
  },
  
  // Add a comment reply
  addCommentReply: async (evaluationId, replyText, replyBy, replyType = 'teacher') => {
    return apiRequest(`${API_URL}/comment-reply`, {
        method: 'POST',
      body: JSON.stringify({
        evaluationId,
        replyText,
        replyBy,
        replyType
      })
    });
  }
};

// Export existing and new services
export default {
  authService,
  userService,
  markerService,
  apiService,
  apiRequest,
  paginatedService,
  fetchTeacherStats,
  fetchTeacherEvaluationHistory,
  fetchTeacherCategoryPerformance,
  fetchTeacherRecordings,
  fetchTeacherLatestGrade,
  checkTeacherExists,
  recordingsService,
  teacherGradesService,
  commentRepliesService,
  getVideoPlaybackUrl,
  getVideoDownloadUrl,
  migrateToSecureApiCall
}; 