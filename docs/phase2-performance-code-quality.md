# Phase 2: Performance & Code Quality

This document provides implementation steps for Phase 2 improvements focused on performance optimization and code quality.

## 1. Database Connection Optimization

### Current Issues
- Static connection pool configuration
- No monitoring of connection usage

### Implementation Steps

#### 1.1. Environment-Specific Pool Configuration
```javascript
// db-config.js
const dbConfig = {
  development: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  testing: {
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 2000,
  },
  production: {
    max: parseInt(process.env.PG_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '2000'),
  }
};

module.exports = {
  ...dbConfig[process.env.NODE_ENV || 'development'],
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined
};
```

#### 1.2. Connection Monitoring
```javascript
// db-monitor.js
class DbMonitor {
  constructor(pool) {
    this.pool = pool;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      queryCount: 0,
      errorCount: 0,
      avgQueryTime: 0
    };
    this.queryTimes = [];
    this.maxSamples = 100;
    this.setupListeners();
    this.startPeriodicLogging();
  }

  setupListeners() {
    this.pool.on('connect', () => {
      this.stats.totalConnections++;
      this.stats.activeConnections++;
    });

    this.pool.on('acquire', () => {
      this.stats.idleConnections--;
      this.stats.activeConnections++;
    });

    this.pool.on('release', () => {
      this.stats.activeConnections--;
      this.stats.idleConnections++;
    });

    this.pool.on('error', () => {
      this.stats.errorCount++;
    });
  }

  recordQueryTime(duration) {
    this.stats.queryCount++;
    this.queryTimes.push(duration);
    if (this.queryTimes.length > this.maxSamples) {
      this.queryTimes.shift();
    }
    this.stats.avgQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
  }

  startPeriodicLogging() {
    setInterval(() => {
      // Update pool stats
      this.stats.idleConnections = this.pool.idleCount;
      this.stats.totalConnections = this.pool.totalCount;
      this.stats.waitingClients = this.pool.waitingCount;
      this.stats.activeConnections = this.pool.totalCount - this.pool.idleCount;

      console.log('DB Pool Stats:', {
        active: this.stats.activeConnections,
        idle: this.stats.idleConnections,
        waiting: this.stats.waitingClients,
        total: this.stats.totalConnections,
        queries: this.stats.queryCount,
        errors: this.stats.errorCount,
        avgQueryTime: `${this.stats.avgQueryTime.toFixed(2)}ms`
      });
    }, 60000); // Log every minute
  }
}

module.exports = DbMonitor;
```

## 2. Caching Strategy

### Current Issues
- Basic in-memory caching for Google Drive operations
- No expiration for cached items

### Implementation Steps

#### 2.1. Install Node-Cache
```
npm install node-cache --save
```

#### 2.2. Create Cache Service
```javascript
// services/cache-service.js
const NodeCache = require('node-cache');

class CacheService {
  constructor(ttlSeconds = 3600) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false
    });
    
    // Stats
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0
    };
  }

  get(key) {
    const value = this.cache.get(key);
    if (value) {
      this.stats.hits++;
      return value;
    }
    this.stats.misses++;
    return null;
  }

  set(key, value, ttl = undefined) {
    this.cache.set(key, value, ttl);
    this.stats.keys = this.cache.keys().length;
    return value;
  }

  del(key) {
    this.cache.del(key);
    this.stats.keys = this.cache.keys().length;
  }

  flush() {
    this.cache.flushAll();
    this.stats.keys = 0;
  }

  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  // Decorator for caching async function results
  async cachedFn(key, fn, ttl = undefined) {
    const cachedValue = this.get(key);
    if (cachedValue) return cachedValue;
    
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }
}

// Create instances for different cache types
const teacherCache = new CacheService(3600); // 1 hour
const fileCache = new CacheService(1800);    // 30 minutes
const userCache = new CacheService(7200);    // 2 hours

module.exports = {
  teacherCache,
  fileCache,
  userCache,
  CacheService
};
```

#### 2.3. Implement Cache for Google Drive Operations
```javascript
// Update drive-service.js
const { teacherCache, fileCache } = require('./services/cache-service');

/**
 * List all teacher folders in the root directory with pagination
 */
async function listTeacherFoldersPaginated(options = {}) {
  const cacheKey = `teacher_folders_${options.pageToken || 'first'}_${options.pageSize || DEFAULT_PAGE_SIZE}`;
  
  return await fileCache.cachedFn(cacheKey, async () => {
    const drive = await getDriveService();
    const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
    
    const response = await drive.files.list({
      q: `'${ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'nextPageToken, files(id, name)',
      pageSize: pageSize,
      pageToken: options.pageToken || null,
    });
    
    return {
      items: response.data.files,
      nextPageToken: response.data.nextPageToken
    };
  });
}
```

## 3. Code Organization

### Current Issues
- Large, monolithic server.js file (5398 lines)
- Mixed concerns in single files

### Implementation Steps

#### 3.1. Define Project Structure
```
project1-backend/
├── config/
│   ├── database.js
│   ├── cors.js
│   ├── auth.js
│   └── env.js
├── controllers/
│   ├── auth.controller.js
│   ├── user.controller.js
│   ├── video.controller.js
│   └── evaluation.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   └── error.middleware.js
├── models/
│   ├── user.model.js
│   ├── video.model.js
│   └── evaluation.model.js
├── routes/
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── video.routes.js
│   └── evaluation.routes.js
├── services/
│   ├── auth.service.js
│   ├── user.service.js
│   ├── video.service.js
│   ├── drive.service.js
│   └── cache.service.js
├── utils/
│   ├── logging.js
│   ├── error-handler.js
│   └── validators.js
└── server.js
```

#### 3.2. Create Route Files (Example)
```javascript
// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validator } = require('../middleware/validation.middleware');
const schemas = require('../utils/validation-schemas');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Auth routes
router.post('/register', csrfProtection, validator.body(schemas.register), authController.register);
router.post('/login', csrfProtection, validator.body(schemas.login), authController.login);
router.post('/logout', csrfProtection, authController.logout);
router.get('/check', authController.checkAuth);
router.get('/csrf-token', csrfProtection, authController.getCsrfToken);

module.exports = router;
```

#### 3.3. Create Controller Files (Example)
```javascript
// controllers/auth.controller.js
const authService = require('../services/auth.service');

// Auth controller methods
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    const result = await authService.registerUser(email, password, name);
    
    // Set auth cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Return user data
    res.status(201).json({
      user: result.user,
      authenticated: true
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    
    // Set auth cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Return user data
    res.json({
      user: result.user,
      authenticated: true
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.checkAuth = (req, res) => {
  // The auth middleware would have rejected if not authenticated
  res.json({ authenticated: true });
};

exports.getCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
};
```

#### 3.4. Update Server.js to Use Modular Structure
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { corsOptions } = require('./config/cors');
const validateEnv = require('./config/env');
const errorMiddleware = require('./middleware/error.middleware');

// Validate environment variables
if (!validateEnv()) {
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/videos', require('./routes/video.routes'));
app.use('/api/evaluations', require('./routes/evaluation.routes'));

// Static files route for videos
app.use('/videos', express.static(process.env.VIDEO_BASE_DIR || 'C:/Users/DELL/Desktop/Zoom Recording Archive/02'));

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 4. API Documentation

### Current Issues
- No API documentation for frontend developers
- No clear API contract

### Implementation Steps

#### 4.1. Install Swagger Tools
```
npm install swagger-jsdoc swagger-ui-express --save
```

#### 4.2. Configure Swagger
```javascript
// config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RHET Zoom Archive API',
      version: '1.0.0',
      description: 'API documentation for RHET Zoom Archive application',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://production-api-url.com/api' 
          : 'http://localhost:3002/api',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth_token'
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
```

#### 4.3. Add Swagger to Express
```javascript
// Add to server.js
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
```

#### 4.4. Document Routes with JSDoc Comments
```javascript
// Example documentation in auth.routes.js
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     description: Authenticates a user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     userType:
 *                       type: string
 *                 authenticated:
 *                   type: boolean
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Authentication failed
 */
router.post('/login', csrfProtection, validator.body(schemas.login), authController.login);
```

## 5. Error Handling Standardization

### Current Issues
- Inconsistent error handling across the codebase
- No standard error format

### Implementation Steps

#### 5.1. Create Custom Error Classes
```javascript
// utils/errors.js
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message, errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', errorCode = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access denied', errorCode = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

class ServerError extends AppError {
  constructor(message = 'Internal server error', errorCode = 'SERVER_ERROR') {
    super(message, 500, errorCode);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError
};
```

#### 5.2. Create Error Handler Middleware
```javascript
// middleware/error.middleware.js
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    errorCode: err.errorCode || 'UNKNOWN_ERROR',
    isOperational: err.isOperational || false
  });

  // Operational errors - trusted errors that we can send to client
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.errorCode,
      status: 'error'
    });
  }

  // Validation errors (from Joi)
  if (err && err.error && err.error.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.error.details.map(detail => ({
        message: detail.message,
        path: detail.path
      })),
      status: 'error',
      code: 'VALIDATION_ERROR'
    });
  }

  // For production, don't leak error details for other errors
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Something went wrong. Please try again later.',
      status: 'error',
      code: 'SERVER_ERROR'
    });
  }

  // For development, send full error
  return res.status(500).json({
    error: err.message,
    stack: err.stack,
    status: 'error',
    code: 'SERVER_ERROR'
  });
};

module.exports = errorMiddleware;
```

#### 5.3. Create Logger Service
```javascript
// utils/logger.js
const winston = require('winston');
const path = require('path');

const logsDir = process.env.LOGS_DIR || path.join(__dirname, '../logs');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'rhet-zoom-archive' },
  transports: [
    // Console transport (all levels in development, only warnings and errors in production)
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    
    // File transport for all logs
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

module.exports = logger;
```

## Implementation Checklist

- [ ] Implement environment-specific database connection pools
- [ ] Add database connection monitoring
- [ ] Set up node-cache for caching with TTL
- [ ] Apply caching to Google Drive operations
- [ ] Reorganize code into controllers, routes, services structure
- [ ] Set up Swagger documentation
- [ ] Create standardized error handling system
- [ ] Implement structured logging

## Testing Plan

1. **Database Optimization**:
   - Monitor connection pool usage under load
   - Verify connection reuse and release
   - Test error recovery scenarios

2. **Caching**:
   - Measure performance before and after caching
   - Verify cache invalidation works correctly
   - Test cache hit/miss statistics

3. **Code Structure**:
   - Verify all endpoints work after refactoring
   - Check module dependencies for circular references
   - Test middleware chains

4. **API Documentation**:
   - Verify all endpoints are documented
   - Test interactive API exploration
   - Check response schemas match actual responses

5. **Error Handling**:
   - Test error responses for different error types
   - Verify operational vs. non-operational error handling
   - Check logging output for errors 