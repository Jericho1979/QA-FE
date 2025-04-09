# Security Update Example: AuthForm.jsx

This document demonstrates how to update the `AuthForm.jsx` component to implement cookie-based authentication instead of using localStorage for token storage.

## Current Implementation (with localStorage)

```jsx
// Inside handleSubmit function
try {
  let response;
  
  if (isLogin) {
    // Login
    console.log('Attempting login with:', email);
    response = await authService.login(email, password);
  } else {
    // Register
    console.log('Attempting registration with:', { email, name });
    
    const username = name || email.split('@')[0];
    console.log('Using username for registration:', username);
    
    response = await authService.register(email, password, username);
  }
  
  console.log('Authentication successful:', response);
  
  // Store token
  localStorage.setItem('token', response.token);
  localStorage.setItem('userType', response.user.userType);
  localStorage.setItem('userEmail', response.user.email);
  
  // Store user name if available, otherwise use email username part
  const userName = response.user.name || email.split('@')[0];
  localStorage.setItem('userName', userName);
  
  // Redirect based on user type
  const userType = response.user.userType;
  
  if (userType === 'admin') {
    navigate('/admin');
  } else if (userType === 'teacher') {
    navigate(`/teacher-dashboard/${response.user.email}`);
  } else if (userType === 'qa') {
    navigate('/teachers');
  } else {
    navigate('/');
  }
} catch (err) {
  console.error('Authentication error:', err);
  setError(err.message || 'Authentication failed');
}
```

## Updated Implementation (with cookie-based authentication)

```jsx
// Inside handleSubmit function
try {
  let response;
  
  if (isLogin) {
    // Login - authService.login already uses cookies internally
    console.log('Attempting login with:', email);
    response = await authService.login(email, password);
  } else {
    // Register - authService.register already uses cookies internally
    console.log('Attempting registration with:', { email, name });
    
    const username = name || email.split('@')[0];
    console.log('Using username for registration:', username);
    
    response = await authService.register(email, password, username);
  }
  
  console.log('Authentication successful:', response);
  
  // The cookie is automatically set by the server in the response
  // No need to store the token manually
  
  // Redirect based on user type
  const userType = response.user.userType;
  
  if (userType === 'admin') {
    navigate('/admin');
  } else if (userType === 'teacher') {
    navigate(`/teacher-dashboard/${response.user.email}`);
  } else if (userType === 'qa') {
    navigate('/teachers');
  } else {
    navigate('/');
  }
} catch (err) {
  console.error('Authentication error:', err);
  setError(err.message || 'Authentication failed');
}
```

## Changes Explained

1. **Removed localStorage Operations**:
   - Removed all `localStorage.setItem()` calls since the authentication token is now stored in an HttpOnly cookie by the server
   - User information like `userType` and `userEmail` is now accessible via the `authService.getCurrentUser()` method when needed

2. **Server-Side Changes (already implemented)**:
   - The backend now sets an HttpOnly cookie containing the JWT token
   - The cookie is automatically sent with subsequent requests
   - CSRF protection has been added to prevent cross-site request forgery

3. **Other Components**:
   - Components that previously accessed user information from localStorage should now use `authService.getCurrentUser()`
   - For example: `const currentUser = await authService.getCurrentUser();`

## Benefits of This Update

1. **Enhanced Security**:
   - HttpOnly cookies can't be accessed by JavaScript, protecting against XSS attacks
   - CSRF protection prevents unauthorized requests from other sites
   - Token is never exposed in client-side code

2. **Improved Maintainability**:
   - Authentication logic is centralized in the `authService`
   - Components don't need to manually handle token storage and retrieval

3. **Better User Experience**:
   - User sessions persist naturally with cookies
   - No need to manually handle token expiration in the UI 