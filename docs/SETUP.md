# RHET Zoom Archive - Setup Instructions

This document provides setup instructions for the RHET Zoom Archive application, particularly focused on implementing the security improvements outlined in the improvement roadmap.

## Required Dependencies

First, install the required dependencies for the security improvements:

### Backend Dependencies

Navigate to the backend directory and install the following packages:

```bash
cd "RHET-Zoom-Archive With Neon2Backtrack/RHET-Zoom-Archive With Neon/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/project1-backend"
npm install cookie-parser --save
npm install joi express-joi-validation --save
npm install csurf --save
```

### Frontend Dependencies

Navigate to the frontend directory and install the following packages:

```bash
cd "RHET-Zoom-Archive With Neon2Backtrack/RHET-Zoom-Archive With Neon/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/project1"
npm install yup --save
```

## Environment Configuration

1. Copy the `.env.example` file to `.env` in the backend directory:

```bash
cd "RHET-Zoom-Archive With Neon2Backtrack/RHET-Zoom-Archive With Neon/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/project1-backend"
cp .env.example .env
```

2. Edit the `.env` file with your specific configuration values:

```
# Database Configuration
PGUSER=your_db_user                # e.g., neondb_owner
PGPASSWORD=your_password           # e.g., your_actual_password
PGHOST=your_db_host                # e.g., ep-divine-smoke-a138jirw-pooler.ap-southeast-1.aws.neon.tech
PGDATABASE=your_db_name            # e.g., neondb
PGPORT=5432
PGSSL=true
PG_MAX_CONNECTIONS=20
PG_IDLE_TIMEOUT=30000
PG_CONNECTION_TIMEOUT=2000

# JWT Configuration
JWT_SECRET=your_jwt_secret         # Generate a strong random string, at least 32 characters
JWT_EXPIRY=24h

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_ENABLED=true

# Server Configuration
NODE_ENV=development
PORT=3002
FRONTEND_URL=http://localhost:5173

# Video Storage
VIDEO_BASE_DIR=C:/Users/DELL/Desktop/Zoom Recording Archive/02    # Update with your actual path
```

3. For the frontend, create a `.env.local` file in the project1 directory:

```bash
cd "RHET-Zoom-Archive With Neon2Backtrack/RHET-Zoom-Archive With Neon/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/project1"
touch .env.local
```

4. Edit the `.env.local` file with the following content:

```
VITE_API_URL=http://localhost:3002/api

# Firebase configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

## Generating a Strong JWT Secret

You can generate a strong JWT secret using one of these methods:

### Using Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL

```bash
openssl rand -hex 32
```

Use the generated value as your JWT_SECRET in the .env file.

## Implementing CSRF Protection

To fully implement CSRF protection, you'll need to update the frontend to include the CSRF token in all state-changing requests. Create a CSRF token utility:

1. Create a file at `project1/src/utils/csrf.js`:

```javascript
// Fetch a CSRF token from the server
export const fetchCSRFToken = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/csrf-token', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch CSRF token');
    }
    
    const { csrfToken } = await response.json();
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
};

// Add CSRF token to fetch options
export const addCSRFToken = async (options = {}) => {
  const csrfToken = await fetchCSRFToken();
  
  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': csrfToken
    }
  };
};
```

2. Use this utility for all state-changing requests in your frontend code.

## Testing Your Security Improvements

After implementing these changes, test the application to ensure everything works correctly:

1. Start the backend server:

```bash
cd "RHET-Zoom-Archive With Neon2Backtrack/RHET-Zoom-Archive With Neon/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/project1-backend"
npm run dev
```

2. Start the frontend development server:

```bash
cd "RHET-Zoom-Archive With Neon2Backtrack/RHET-Zoom-Archive With Neon/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/RHET-Zoom-Archive-main/project1"
npm run dev
```

3. Test the application by logging in, registering, and performing various actions to ensure everything works as expected.

## Troubleshooting

If you encounter issues:

1. **Cookie Issues**: Ensure that the frontend and backend are running on the allowed origins specified in the CORS configuration.

2. **CSRF Token Errors**: Verify that the CSRF token is being sent correctly in headers for all state-changing requests.

3. **Authentication Failures**: Check that the `credentials: 'include'` option is being used for all fetch requests to ensure cookies are sent.

4. **JWT Verification Errors**: Verify that the JWT_SECRET is consistent between environment variables and your code.

For any persistent issues, review the server logs for detailed error messages. 