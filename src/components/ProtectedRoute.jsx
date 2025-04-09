import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/apiService';

const ProtectedRoute = ({ children, requiredUserType }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log('ProtectedRoute: Starting authentication check...');
      try {
        // With cookie-based auth, we need to check auth status from the server
        // The isAuthenticated method doesn't actually check with the server
        // but we still call it for compatibility
        console.log('ProtectedRoute: Calling isAuthenticated...');
        authService.isAuthenticated();
        
        // Get the current user from the server
        console.log('ProtectedRoute: Fetching current user...');
        const userData = await authService.getCurrentUser();
        
        if (userData) {
          console.log('ProtectedRoute: User data received:', userData);
          setUser(userData);
          // Handle both user_type and userType formats
          const userTypeValue = userData.user_type || userData.userType;
          setUserType(userTypeValue);
          console.log('ProtectedRoute: User type set to:', userTypeValue);
        } else {
          console.log('ProtectedRoute: No user data returned from getCurrentUser');
          setAuthError('No user data returned');
        }
      } catch (error) {
        console.error('ProtectedRoute: Auth check error:', error);
        setAuthError(error.message);
        // Clear invalid token
        try {
          console.log('ProtectedRoute: Attempting to logout...');
          await authService.logout();
          console.log('ProtectedRoute: Logout successful');
        } catch (logoutError) {
          console.error('ProtectedRoute: Logout error:', logoutError);
        }
      } finally {
        console.log('ProtectedRoute: Authentication check complete');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading authentication status...</div>;
  }

  if (!user) {
    console.log('ProtectedRoute: No authenticated user, redirecting to login');
    return (
      <div>
        <Navigate to="/login" />
        {authError && (
          <div style={{ display: 'none' }}>
            Authentication error: {authError}
          </div>
        )}
      </div>
    );
  }

  if (requiredUserType && userType !== requiredUserType) {
    console.log(`ProtectedRoute: User type ${userType} does not match required type ${requiredUserType}, redirecting`);
    // Redirect based on user type
    if (userType === 'admin') {
      return <Navigate to="/admin" />;
    } else if (userType === 'qa') {
      return <Navigate to="/teachers" />;
    } else {
      // Extract username for teacher redirect
      let username = user.email.split('@')[0];
      if (username.startsWith('t.')) {
        username = username.substring(2);
      }
      return <Navigate to={`/teacher-dashboard/${username}`} />;
    }
  }

  console.log('ProtectedRoute: Authentication successful, rendering children');
  return children;
};

export default ProtectedRoute; 