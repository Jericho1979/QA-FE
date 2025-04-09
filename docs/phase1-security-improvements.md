# Phase 1: Security & Critical Fixes

This document provides detailed implementation steps for the Phase 1 security improvements and critical fixes for the RHET Zoom Archive system.

## 1. Environment Variables Protection

### Current Issues
- Sensitive database credentials are hardcoded in `.env` file
- Firebase configuration is exposed in the source code
- No validation for required environment variables

### Implementation Steps

#### 1.1. Create Proper Environment Templates
Create a `.env.example` file that shows the structure without actual values:

```
# Database Configuration
PGUSER=your_db_user
PGPASSWORD=your_password
PGHOST=your_db_host
PGDATABASE=your_db_name
PGPORT=5432
PGSSL=true

# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h

# Google Drive API
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri

# Server Configuration
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:5173
```

#### 1.2. Update Backend Configuration Loading
Update the db.js file to secure database configuration:

```javascript
// Load environment variables with defaults and validation
const requiredEnvVars = ['PGUSER', 'PGPASSWORD', 'PGHOST', 'PGDATABASE'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`Error: Environment variable ${varName} is required`);
    process.exit(1);
  }
});

const dbConfig = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
  // Connection pool configuration
  max: parseInt(process.env.PG_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '2000'),
  // Add SSL configuration for Neon
  ssl: process.env.PGSSL === 'true' ? {
    rejectUnauthorized: true
  } : undefined
};
```

#### 1.3. Update Frontend Configuration
Create a config.js file to handle environment variables in the frontend:

```javascript
// src/config.js
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3002/api',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  }
};

export default config;
```

#### 1.4. Create Environment Variable Validation Utility

```javascript
// validateEnv.js
const validateEnv = () => {
  const requiredEnvVars = [
    'PGUSER', 
    'PGPASSWORD', 
    'PGHOST', 
    'PGDATABASE',
    'JWT_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};

module.exports = validateEnv;
```

#### 1.5. Documentation
Create a SETUP.md file with environment configuration instructions for development and production.

## 2. JWT Secret Security

### Current Issues
- JWT secret is hardcoded in server.js
- No JWT expiration or rotation mechanism

### Implementation Steps

#### 2.1. Move JWT Secret to Environment Variables
Update the JWT authentication code in server.js:

```javascript
// Load JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable must be set');
  process.exit(1);
}

// JWT expiration time from environment or default
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
```

#### 2.2. Update Token Generation with Expiry
Update the token generation logic:

```javascript
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      userType: user.user_type
    }, 
    JWT_SECRET, 
    { 
      expiresIn: JWT_EXPIRY 
    }
  );
};
```

#### 2.3. Create Token Verification Middleware
Create a more robust token verification middleware:

```javascript
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
};
```

## 3. Token Storage Security

### Current Issues
- Frontend stores JWT tokens in localStorage, which is vulnerable to XSS attacks
- No CSRF protection

### Implementation Steps

#### 3.1. Update Backend Authentication to Use Cookies
Modify the login endpoint:

```javascript
app.post('/api/auth/login', async (req, res) => {
  // Existing authentication logic...
  
  // If authentication successful:
  const token = generateToken(user);
  
  // Set HttpOnly cookie
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    sameSite: 'strict', // Helps with CSRF
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Return user info but not the token
  res.json({ 
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.user_type
    },
    authenticated: true
  });
});
```

#### 3.2. Add Logout Endpoint to Clear Cookie
```javascript
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});
```

#### 3.3. Update Authentication Middleware to Use Cookies
```javascript
const verifyToken = (req, res, next) => {
  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      res.clearCookie('auth_token');
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    res.clearCookie('auth_token');
    return res.status(403).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
  }
};
```

#### 3.4. Add CSRF Protection
Install the CSRF middleware:
```
npm install csurf --save
```

Implement CSRF protection:
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Apply CSRF protection to state-changing routes
app.post('/api/auth/login', csrfProtection, authController.login);
app.post('/api/auth/register', csrfProtection, authController.register);
// Apply to other routes that change state...

// Endpoint to get a CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

#### 3.5. Update Frontend Authentication Logic
Modify the frontend auth service:

```javascript
// authService.js
export const authService = {
  // Login user
  login: async (email, password) => {
    try {
      // Get CSRF token first
      const csrfResponse = await fetch(`${API_URL}/csrf-token`);
      const { csrfToken } = await csrfResponse.json();
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async () => {
    // Get CSRF token first
    const csrfResponse = await fetch(`${API_URL}/csrf-token`);
    const { csrfToken } = await csrfResponse.json();
    
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'CSRF-Token': csrfToken
      },
      credentials: 'include'
    });
  },
  
  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/check`, {
        credentials: 'include'
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  },
}
```

## 4. CORS Configuration

### Current Issues
- Development-focused CORS configuration
- No environment-specific settings

### Implementation Steps

#### 4.1. Create Environment-Specific CORS Configuration
```javascript
// cors-config.js
const corsOptions = {
  development: {
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'CSRF-Token'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Disposition'],
    credentials: true
  },
  production: {
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'CSRF-Token'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Content-Disposition'],
    credentials: true
  }
};

module.exports = corsOptions[process.env.NODE_ENV || 'development'];
```

#### 4.2. Implement Updated CORS in Server
```javascript
const cors = require('cors');
const corsOptions = require('./cors-config');

// Validate CORS configuration
if (process.env.NODE_ENV === 'production' && (!corsOptions.origin || corsOptions.origin.length === 0)) {
  console.error('Error: FRONTEND_URL environment variable must be set in production');
  process.exit(1);
}

// Configure CORS
app.use(cors(corsOptions));
```

## 5. Input Validation

### Current Issues
- Inconsistent input validation
- Potential for injection attacks

### Implementation Steps

#### 5.1. Install Validation Library
```
npm install joi express-joi-validation --save
```

#### 5.2. Create Validation Schemas
```javascript
// validation/schemas.js
const Joi = require('joi');

const schemas = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),
  
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),
    userType: Joi.string().valid('admin', 'teacher', 'qa').required()
  }),
  
  createUser: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).required(),
    password: Joi.string().min(6).required(),
    user_type: Joi.string().valid('admin', 'teacher', 'qa').required()
  }),
  
  // Add schemas for other endpoints
};

module.exports = schemas;
```

#### 5.3. Create Validation Middleware
```javascript
// validation/middleware.js
const Joi = require('joi');
const { createValidator } = require('express-joi-validation');

const validator = createValidator();

// Custom error handler for validation errors
const validationErrorHandler = (err, req, res, next) => {
  if (err && err.error && err.error.isJoi) {
    // We had a joi error, let's return a custom 400 json response
    res.status(400).json({
      error: 'Validation error',
      details: err.error.details.map(detail => ({
        message: detail.message,
        path: detail.path
      }))
    });
  } else {
    // Pass on to another error handler
    next(err);
  }
};

module.exports = {
  validator,
  validationErrorHandler
};
```

#### 5.4. Apply Validation to Routes
```javascript
const { validator } = require('./validation/middleware');
const schemas = require('./validation/schemas');

// Apply validation to auth routes
app.post('/api/auth/login', validator.body(schemas.login), authController.login);
app.post('/api/auth/register', validator.body(schemas.register), authController.register);

// Apply validation to user routes
app.post('/api/users', authenticateToken, isAdmin, validator.body(schemas.createUser), userController.createUser);
// Apply to other routes...

// Add validation error handler
app.use(validationErrorHandler);
```

#### 5.5. Add Client-Side Validation
Install a validation library for the frontend:
```
npm install yup --save
```

Create a validation utility:
```javascript
// src/utils/validation.js
import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
});

export const registerSchema = yup.object({
  name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Please enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Password confirmation is required')
});

// Add more schemas as needed
```

## Implementation Checklist

- [ ] Create environment variable templates and documentation
- [ ] Secure database configuration code
- [ ] Update frontend configuration management
- [ ] Implement JWT security improvements
- [ ] Convert token storage to HttpOnly cookies
- [ ] Add CSRF protection
- [ ] Create environment-specific CORS configuration
- [ ] Implement comprehensive input validation

## Testing Plan

To verify the security improvements:

1. **Environment Variables**:
   - Test application startup with missing required variables
   - Verify error messages and logging
   - Confirm secure loading of values

2. **JWT Security**:
   - Test token expiration behavior
   - Verify JWT secrets are properly hidden
   - Test token verification error handling

3. **Cookie-Based Authentication**:
   - Test login flow with cookie storage
   - Verify XSS protection (cookies not accessible via JavaScript)
   - Test CSRF protection on state-changing endpoints
   - Test logout functionality

4. **CORS Configuration**:
   - Test API access from allowed origins
   - Verify blocking of requests from unauthorized origins
   - Test credential inclusion in cross-origin requests

5. **Input Validation**:
   - Test error responses for invalid inputs
   - Verify validation of all critical fields
   - Test client-side validation behavior
</rewritten_file> 