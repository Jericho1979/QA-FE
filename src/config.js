// src/config.js
// Configuration for the frontend application

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Video configuration
const videoConfig = {
  baseStreamUrl: import.meta.env.VITE_VIDEO_STREAM_URL || 'http://localhost:3002/stream',
  baseDriveStreamUrl: import.meta.env.VITE_DRIVE_STREAM_URL || 'http://localhost:3002/stream-drive',
  baseDownloadUrl: import.meta.env.VITE_VIDEO_DOWNLOAD_URL || 'http://localhost:3002/download-video',
  baseDriveDownloadUrl: import.meta.env.VITE_DRIVE_DOWNLOAD_URL || 'http://localhost:3002/download-drive'
};

// Authentication configuration
const authConfig = {
  allowedEmailDomain: import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'rhet-corp.com',
  tokenRefreshInterval: parseInt(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL || '840000'), // 14 minutes in ms
  sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '86400000') // 24 hours in ms
};

// Export the configuration
const config = {
  API_URL,
  firebase: firebaseConfig,
  video: videoConfig,
  auth: authConfig,
  isDevelopment: import.meta.env.DEV || false,
  isProduction: import.meta.env.PROD || false
};

// Log the configuration in development mode
if (config.isDevelopment) {
  console.log('Application configuration:', {
    ...config,
    firebase: {
      ...config.firebase,
      apiKey: config.firebase.apiKey ? '********' : undefined
    }
  });
}

export default config; 