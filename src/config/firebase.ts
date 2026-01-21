/**
 * Firebase Configuration
 *
 * Initialize Firebase with your project credentials.
 * This file handles Firebase setup and exports configured services.
 *
 * Usage:
 * ```typescript
 * import { initializeFirebase } from './config/firebase';
 *
 * // In your app initialization
 * initializeFirebase();
 * ```
 */

import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Replace with your Firebase project credentials
// Get these from Firebase Console > Project Settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ============================================================================
// INITIALIZATION
// ============================================================================

let app: FirebaseApp | null = null;

/**
 * Initialize Firebase
 *
 * Call this once during app startup, typically in App.tsx or index.tsx
 *
 * Example:
 * ```typescript
 * import { initializeFirebase } from './config/firebase';
 *
 * function App() {
 *   useEffect(() => {
 *     initializeFirebase();
 *   }, []);
 *   // ...
 * }
 * ```
 */
export function initializeFirebase(): FirebaseApp {
  if (app) return app;

  if (import.meta.env.VITE_USE_FIREBASE !== "true") {
    throw new Error(
      "[Firebase] Firebase is disabled. Set VITE_USE_FIREBASE=true to enable.",
    );
  }

  // Validate required config
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.projectId
  ) {
    throw new Error("[Firebase] Missing Firebase environment variables.");
  }

  app = initializeApp(firebaseConfig);

  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true"
  ) {
    connectFirestoreEmulator(getFirestore(app), "localhost", 8080);
    connectStorageEmulator(getStorage(app), "localhost", 9199);
    connectAuthEmulator(getAuth(app), "http://localhost:9099", {
      disableWarnings: true,
    });
  }

  return app;
}

/**
 * Get initialized Firebase app instance
 * Throws error if Firebase hasn't been initialized yet
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error(
      "[Firebase] Not initialized. Call initializeFirebase() first.",
    );
  }
  return app;
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return app !== null;
}

/**
 * Get Firebase Storage instance
 * Throws error if Firebase hasn't been initialized yet
 */
export function getFirebaseStorage() {
  if (!app) {
    throw new Error(
      "[Firebase] Not initialized. Call initializeFirebase() first.",
    );
  }
  return getStorage(app);
}

// ============================================================================
// ENVIRONMENT VARIABLES GUIDE
// ============================================================================

/**
 * Required environment variables for Firebase:
 *
 * Add to .env file:
 * ```
 * REACT_APP_FIREBASE_API_KEY=your_api_key
 * REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
 * REACT_APP_FIREBASE_PROJECT_ID=your_project_id
 * REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
 * REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
 * REACT_APP_FIREBASE_APP_ID=your_app_id
 *
 * # Optional: Use Firebase Emulator in development
 * REACT_APP_USE_FIREBASE_EMULATOR=true
 * ```
 *
 * Steps to get these values:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Select your project
 * 3. Click "Project Settings" (gear icon)
 * 4. Copy the config object
 * 5. Add to .env file with REACT_APP_ prefix
 *
 * Example Firebase config from console:
 * ```
 * const firebaseConfig = {
 *   apiKey: "AIzaSyBpqzR6234...",
 *   authDomain: "housing-app.firebaseapp.com",
 *   projectId: "housing-app-12345",
 *   storageBucket: "housing-app-12345.appspot.com",
 *   messagingSenderId: "123456789",
 *   appId: "1:123456789:web:abcdef1234567890"
 * };
 * ```
 */

// ============================================================================
// FIRESTORE SETUP GUIDE
// ============================================================================

/**
 * Required Firestore Collections and Indexes:
 *
 * 1. Create "listings" collection:
 *    - Document structure defined in FirebaseListingService
 *    - See firebaseListingService.ts for document schema
 *
 * 2. Compound indexes for efficient querying:
 *    Firebase will suggest creating these when you use multi-field queries.
 *    Examples:
 *
 *    Index 1: listings (location.state, status, createdAt)
 *    - Used for: filtering by state + status + sorting by date
 *
 *    Index 2: listings (location.state, location.city, rent)
 *    - Used for: filtering by state + city + price range
 *
 *    Index 3: listings (isActive, rent, createdAt)
 *    - Used for: filtering active listings + price range + sorting
 *
 * 3. Firebase Storage structure:
 *    - /listings/{listingId}/{imageId}
 *    - Automatically created when images are uploaded
 *    - Security rules:
 *      ```
 *      rules_version = '2';
 *      service firebase.storage {
 *        match /b/{bucket}/o {
 *          match /listings/{listingId}/{allPaths=**} {
 *            allow read: if request.auth != null;
 *            allow write: if request.auth != null;
 *          }
 *        }
 *      }
 *      ```
 *
 * 4. Firestore Security Rules:
 *    ```
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /listings/{document=**} {
 *          allow read: if true; // Public read
 *          allow create: if request.auth != null;
 *          allow update: if request.auth.uid == resource.data.listedBy.id;
 *          allow delete: if request.auth.uid == resource.data.listedBy.id;
 *        }
 *      }
 *    }
 *    ```
 */
