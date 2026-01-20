/**
 * Service Factory & Initialization
 *
 * This module is the single point where the service implementation is instantiated.
 *
 * Benefits:
 * - Centralized service configuration
 * - Easy backend swapping (just change the import/instantiation here)
 * - Consistent initialization across the app
 * - Dependency injection pattern
 *
 * To migrate to a different backend:
 * 1. Create a new service class (e.g., FirebaseListingService)
 * 2. Import it here instead of MockListingService
 * 3. Initialize it with the same interface
 * 4. No changes needed in UI code
 */

import type { IListingService } from "./types";
import { MockListingService } from "./implementations/mockListingService";
import { FirebaseListingService } from "./implementations/firebaseListingService";
import { convertMockDataToDomain } from "../services/adapters/mockDataAdapter";

/**
 * Service instance - initialized once, used throughout the app
 * This is a singleton pattern to ensure consistency
 */
let listingServiceInstance: IListingService | null = null;

/**
 * Backend type selector
 * Set this via environment variable or runtime configuration
 */
type BackendType = "mock" | "firebase";
const BACKEND_TYPE: BackendType =
  (import.meta.env.VITE_REACT_APP_BACKEND as BackendType) || "mock";

/**
 * Initialize the listing service
 * Called once during app startup
 *
 * The service implementation is selected via REACT_APP_BACKEND environment variable:
 * - "mock": Uses MockListingService with in-memory storage (development)
 * - "firebase": Uses FirebaseListingService with Firestore/Firebase Storage (production)
 *
 * Regardless of backend:
 * - Same IListingService interface is implemented
 * - Same domain models are returned
 * - No UI code changes required
 */
export async function initializeListingService(): Promise<IListingService> {
  if (listingServiceInstance) {
    return listingServiceInstance;
  }

  console.log(`[ServiceFactory] Initializing ${BACKEND_TYPE} backend...`);

  if (BACKEND_TYPE === "firebase") {
    // Production: Firebase backend
    // Note: Firebase must be initialized before this is called
    const service = new FirebaseListingService({
      defaultPageSize: 20,
      enableLogging: false,
    });

    listingServiceInstance = service;
    console.log("[ServiceFactory] Firebase service initialized");
    return service;
  } else {
    // Development: Mock backend
    const service = new MockListingService({
      defaultPageSize: 20,
      enableLogging: false,
    });

    // Initialize with mock data
    const mockData = convertMockDataToDomain();
    service.initializeWithMockData(mockData);

    listingServiceInstance = service;
    console.log("[ServiceFactory] Mock service initialized");
    return service;
  }
}

/**
 * Get the current service instance
 * Must call initializeListingService() first
 */
export function getListingService(): IListingService {
  if (!listingServiceInstance) {
    throw new Error(
      "Listing service not initialized. Call initializeListingService() first."
    );
  }
  return listingServiceInstance;
}

/**
 * Reset service instance (useful for testing)
 */
export function resetListingService(): void {
  listingServiceInstance = null;
}

// ============================================================================
// BACKEND MIGRATION GUIDE
// ============================================================================

/**
 * To switch from Mock to Firebase backend:
 *
 * Step 1: Install Firebase dependencies
 * ```bash
 * npm install firebase
 * ```
 *
 * Step 2: Set environment variable
 * Create .env file (or .env.local):
 * ```
 * REACT_APP_BACKEND=firebase
 * REACT_APP_FIREBASE_API_KEY=...
 * REACT_APP_FIREBASE_AUTH_DOMAIN=...
 * REACT_APP_FIREBASE_PROJECT_ID=...
 * REACT_APP_FIREBASE_STORAGE_BUCKET=...
 * REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
 * REACT_APP_FIREBASE_APP_ID=...
 * ```
 *
 * Step 3: Initialize Firebase in your app (typically App.tsx)
 * ```typescript
 * import { useEffect } from 'react';
 * import { initializeFirebase } from './config/firebase';
 *
 * export function App() {
 *   useEffect(() => {
 *     initializeFirebase();
 *   }, []);
 *
 *   // ... rest of component
 * }
 * ```
 *
 * Step 4: That's it!
 * - The service factory automatically picks FirebaseListingService
 * - Same domain models are returned
 * - UI code doesn't change
 *
 * To swap back to Mock:
 * - Just change REACT_APP_BACKEND=mock (or omit it, default is mock)
 * - No code changes needed
 *
 * The architecture ensures complete decoupling between:
 * - Domain models (src/models/domain.ts)
 * - Service interface (src/services/types.ts)
 * - Service implementations (src/services/implementations/)
 * - UI components (src/components/, src/pages/)
 */
