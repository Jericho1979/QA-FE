# Cookie-Based Authentication Migration Plan

This document outlines the step-by-step plan for migrating the RHET Zoom Archive application from localStorage-based token authentication to secure cookie-based authentication with CSRF protection.

## Migration Timeline

| Phase | Description | Timeline | Components |
|-------|-------------|----------|------------|
| 1 | Update Core Authentication | Week 1 | AuthForm.jsx, apiService.js, ProtectedRoute.jsx |
| 2 | Update High Priority Components | Week 2 | QA_Dashboard.jsx, QA_OnlineEvaluation.jsx, QA_TeacherInsights.jsx, QA_TeacherRecordings.jsx |
| 3 | Update Medium Priority Components | Week 3 | TeacherDashboard.jsx, QA_TeacherList.jsx, TeacherVideoMarkers.jsx |
| 4 | Update Low Priority Components | Week 4 | AdminDashboard.jsx, TeacherStats.jsx |
| 5 | Testing and Bug Fixing | Week 5 | All components |
| 6 | Documentation and Knowledge Transfer | Week 6 | N/A |

## Phase 1: Update Core Authentication

### Step 1: Update AuthForm.jsx
- Remove localStorage token storage
- Leave user redirection logic intact
- Ensure proper error handling

### Step 2: Verify ProtectedRoute.jsx
- Confirm it's using authService.isAuthenticated() and authService.getCurrentUser()
- Test authentication persistence
- Update any missing components

### Step 3: Test Authentication Flow
- Verify login works with new cookie-based system
- Confirm registration flow sets cookies correctly
- Test logout to ensure cookies are cleared

## Phase 2: Update High Priority Components

For each component (QA_Dashboard.jsx, QA_OnlineEvaluation.jsx, QA_TeacherInsights.jsx, QA_TeacherRecordings.jsx):

### Step 1: Identify Authentication Code
- Find all instances of localStorage.getItem('token')
- Identify any user information pulled from localStorage

### Step 2: Replace with Secure Code
- Replace direct fetch calls with apiService.apiRequest
- Use authService.getCurrentUser() for user information
- Remove all localStorage references

### Step 3: Test Component
- Verify the component works with the new authentication system
- Test error handling and edge cases
- Ensure CSRF tokens are correctly included where needed

## Phase 3: Update Medium Priority Components

For TeacherDashboard.jsx, QA_TeacherList.jsx, and TeacherVideoMarkers.jsx:

### Step 1: Code Analysis
- Check for both direct and indirect localStorage usage
- Review all API calls to ensure they can use the secure methods

### Step 2: Implementation
- Update API calls to use apiService.apiRequest
- Replace any user information retrieval with authService.getCurrentUser()
- Test each component after updates

## Phase 4: Update Low Priority Components

Update remaining components (AdminDashboard.jsx, TeacherStats.jsx) following the same pattern:
- Replace direct API calls
- Use authService for user information
- Test thoroughly

## Phase 5: Testing and Bug Fixing

### Functionality Testing
- Test all key user flows
- Verify authentication works across the application
- Check that sessions persist correctly

### Security Testing
- Verify CSRF protection is working
- Confirm HttpOnly cookies are set correctly
- Test against common security vulnerabilities

### Performance Testing
- Ensure the new system performs well under load
- Verify there are no regressions in responsiveness

## Phase 6: Documentation and Knowledge Transfer

- Update development documentation
- Create training materials for the team
- Document security improvements for stakeholders

## Risk Assessment and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Authentication failures | High | Medium | Implement rollback capability, test extensively before deploying |
| User sessions lost | High | Low | Ensure proper cookie management, add session recovery mechanisms |
| API incompatibilities | Medium | Medium | Update API endpoints to support both authentication methods during transition |
| Performance issues | Medium | Low | Profile and optimize critical paths, implement caching if needed |
| Browser compatibility | Medium | Low | Test across all supported browsers, implement fallbacks if needed |

## Rollback Plan

In case of critical issues:

1. Create feature flag to toggle between authentication methods
2. Keep both systems functional until migration is complete
3. Maintain the ability to revert to localStorage authentication if needed
4. Document the process for reverting changes

## Success Criteria

The migration will be considered successful when:

1. All components use cookie-based authentication
2. No localStorage references to tokens or authentication remain
3. CSRF protection is implemented for all state-changing operations
4. All tests pass and user experience is maintained
5. Security audit confirms the improvements

## Conclusion

This migration plan provides a structured approach to updating the RHET Zoom Archive application to use cookie-based authentication. By following the phases and steps outlined, the team can ensure a smooth transition while maintaining application security and stability. 