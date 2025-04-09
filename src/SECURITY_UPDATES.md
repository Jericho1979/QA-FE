# Security Updates in RHET Zoom Archive

This document outlines the security improvements made to the RHET Zoom Archive system, with a focus on enhanced authentication and API request handling.

## Changes Implemented

1. **Environment Variables for Configuration**
   - Created a centralized `config.js` file that loads values from environment variables
   - Moved sensitive information like Firebase credentials to environment variables
   - Added validation for required environment variables

2. **Cookie-Based Authentication**
   - Replaced localStorage token storage with secure HttpOnly cookies
   - Updated authentication endpoints to properly set and clear cookies
   - Added CSRF protection for all state-changing requests

3. **CSRF Protection**
   - Created a CSRF utility in `src/utils/csrf.js` that includes:
     - `fetchCSRFToken` to obtain tokens from the server
     - `addCSRFToken` to add tokens to request headers
     - `fetchWithCSRF` as a fetch wrapper to include CSRF tokens
     - `clearCSRFToken` to clear tokens on logout/errors

4. **API Request Security**
   - Updated `apiRequest` function in `apiService.js` to:
     - Always include credentials (cookies)
     - Use CSRF protection for non-Firebase requests
     - Handle errors consistently
     - Properly format request/response data

5. **Migration Utilities**
   - Added `migrateToSecureApiCall` function for easier transition
   - Removed token-based authentication from key components

## How to Migrate Your Components

### Option 1: Use the Migration Utility (Recommended for Quick Fixes)

The `migrateToSecureApiCall` function is a drop-in replacement for direct fetch calls.

```javascript
// Before:
const response = await fetch('http://localhost:3002/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
const data = await response.json();

// After:
const data = await apiService.migrateToSecureApiCall('some-endpoint');
```

### Option 2: Update to Use apiRequest (Better Long-term Solution)

For a more comprehensive update, modify components to use the `apiRequest` function.

```javascript
// Before:
const response = await fetch('http://localhost:3002/api/some-endpoint', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
if (!response.ok) {
  // Error handling...
}
const data = await response.json();

// After:
import { apiService } from '../services/apiService';
import config from '../config';

const API_URL = config.API_URL;

// Later in your code:
const data = await apiService.apiRequest(`${API_URL}/some-endpoint`);
```

### Option 3: Use Dedicated Service Functions

For common operations, use the pre-defined service functions in `apiService.js`.

```javascript
// Before:
const token = localStorage.getItem('token');
const response = await fetch(`http://localhost:3002/api/users`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const users = await response.json();

// After:
const users = await apiService.userService.getAllUsers();
```

## Common Changes Needed

1. **Remove localStorage Token Usage**
   - Replace `localStorage.getItem('token')` with cookie-based auth
   - Remove token checks or storage in components

2. **Update API URLs**
   - Replace hardcoded URLs like `http://localhost:3002/api/` with `config.API_URL`

3. **Use the auth Service for User Information**
   - Replace `localStorage.getItem('userEmail')` with `authService.getCurrentUser()`

4. **Add Proper Imports**
   ```javascript
   import { apiService } from '../services/apiService';
   import config from '../config';
   ```

## Testing Your Changes

After migrating a component:

1. Check browser network requests to ensure cookies are being sent
2. Verify that CSRF tokens are included in POST/PUT/DELETE requests
3. Test authentication flows (login, logout, protected routes)
4. Monitor the console for any errors related to authentication

## Security Best Practices

- Don't store sensitive information in localStorage
- Always use environment variables for configuration
- Use CSRF protection for all state-changing operations
- Include credentials in all API requests that require authentication
- Implement proper error handling for authentication failures
- Don't hardcode URLs or API endpoints

For questions or issues, please refer to the implementation in the core files:
- `src/config.js` - Central configuration
- `src/utils/csrf.js` - CSRF protection
- `src/services/apiService.js` - Secure API request handling
- `src/services/firebaseConfig.js` - Secure Firebase configuration 