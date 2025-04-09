# Security Updates Needed

This document outlines components that still need security updates to align with our enhanced security protocols, specifically the transition from localStorage-based token authentication to cookie-based authentication with CSRF protection.

## High Priority (Components with direct localStorage token usage)

1. **AuthForm.jsx**
   - Lines with issues: ~95-105
   - Problem: Direct localStorage usage for storing tokens and user information
   - Fix: Remove localStorage usage and rely on cookie-based authentication

2. **QA_Dashboard.jsx**
   - Lines with issues: ~445-460, ~560-580
   - Problem: Uses `localStorage.getItem('token')` in fetch headers
   - Fix: Use `apiService.apiRequest` or `migrateToSecureApiCall` 

3. **QA_OnlineEvaluation.jsx**
   - Lines with issues: ~861-904
   - Problem: Uses localStorage for user information and authentication
   - Fix: Replace with `authService.getCurrentUser()` and use secure API calls

4. **QA_TeacherInsights.jsx**
   - Lines with issues: ~352-392
   - Problem: Uses localStorage token in fetch headers
   - Fix: Use `apiService.apiRequest` or `migrateToSecureApiCall`

5. **QA_TeacherRecordings.jsx**
   - Lines with issues: ~1422-1445, ~1632-1687, ~2449-2507
   - Problem: Multiple instances of localStorage token usage in API calls
   - Fix: Use `apiService.apiRequest` and replace user info access with `authService.getCurrentUser()`

## Medium Priority (Components that may have indirectly inherited localStorage token usage)

1. **TeacherDashboard.jsx**
   - Potential issues: Might still use localStorage indirectly or for user information
   - Fix: Verify integration with `apiService` and ensure all API calls use the secure method

2. **QA_TeacherList.jsx**
   - Potential issues: May inherit localStorage token usage from other components
   - Fix: Ensure all API calls use `apiService.apiRequest`

3. **TeacherVideoMarkers.jsx**
   - Needs verification: Check if any API calls use localStorage directly

## Low Priority (Components already using secure methods)

1. **ProtectedRoute.jsx**
   - Already updated to work with cookie-based authentication
   - Calls `authService.isAuthenticated()` and `authService.getCurrentUser()`

2. **AdminDashboard.jsx**
   - Appears to be using authService methods correctly
   - No direct localStorage usage detected, but verify all API calls

## Implementation Steps

For each component that needs updating:

1. Replace direct fetch calls with `apiService.apiRequest` or `migrateToSecureApiCall`
2. Replace localStorage token usage with cookie-based authentication
3. Replace user information retrieval from localStorage with `authService.getCurrentUser()`
4. Remove any remaining localStorage references related to authentication
5. Test the component thoroughly to ensure it works with the new authentication system

## Testing Strategy

After updating each component:

1. Test login/logout functionality
2. Verify that authentication persists after page refresh
3. Check that CSRF tokens are correctly included in state-changing requests
4. Ensure proper error handling when authentication fails

## Resources

- See `src/SECURITY_UPDATES.md` for detailed instructions on the security updates
- Use `src/services/apiService.js` as a reference for secure API calls
- The `migrateToSecureApiCall` function provides an easy migration path 