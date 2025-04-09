// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import config from '../config';

// Use configuration from config.js which loads from environment variables
const firebaseConfig = config.firebase;

// Fallback Firebase configuration if environment variables are not available
const fallbackConfig = {
  apiKey: "AIzaSyAnHOA1TC-gvAu-jNbYKuvUggncdlEhZnw",
  authDomain: "records-784db.firebaseapp.com",
  projectId: "records-784db",
  storageBucket: "records-784db.firebasestorage.app",
  messagingSenderId: "671856434804",
  appId: "1:671856434804:web:99c0846b229e4cbcd2bb21",
  measurementId: "G-XN58ZPT1EW"
};

// Check if required Firebase configuration is available
const isFirebaseConfigValid = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!firebaseConfig[field]) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    console.warn(`Missing required Firebase configuration: ${missingFields.join(', ')}`);
    console.warn('Using fallback Firebase configuration instead of environment variables.');
    return false;
  }
  return true;
};

// Initialize Firebase with config from environment variables or fallback config
let app, auth, db;
const configToUse = isFirebaseConfigValid() ? firebaseConfig : fallbackConfig;

try {
  console.log('Initializing Firebase with:', {
    ...configToUse,
    apiKey: configToUse.apiKey ? '********' : undefined
  });
  
  app = initializeApp(configToUse);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  
  // Create mock objects to prevent null reference errors
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => callback(null),
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not configured')),
    signOut: () => Promise.resolve()
  };
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        set: () => Promise.reject(new Error('Firebase not configured'))
      }),
      where: () => ({
        get: () => Promise.resolve({ empty: true, docs: [] })
      })
    })
  };
}

export { auth, db };