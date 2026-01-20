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
import { convertMockDataToDomain } from "../services/adapters/mockDataAdapter";

/**
 * Service instance - initialized once, used throughout the app
 * This is a singleton pattern to ensure consistency
 */
let listingServiceInstance: IListingService | null = null;

/**
 * Initialize the listing service
 * Called once during app startup
 *
 * In production:
 * - Replace MockListingService with FirebaseListingService, SupabaseListingService, etc.
 * - Replace convertMockDataToDomain with database initialization
 * - Same IListingService interface ensures no UI changes
 */
export async function initializeListingService(): Promise<IListingService> {
  if (listingServiceInstance) {
    return listingServiceInstance;
  }

  // Currently using mock service - swap this for production
  const service = new MockListingService({
    defaultPageSize: 20,
    enableLogging: false,
  });

  // Initialize with mock data
  const mockData = convertMockDataToDomain();
  service.initializeWithMockData(mockData);

  listingServiceInstance = service;
  return service;
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

/**
 * Example of how to swap backends
 *
 * import { FirebaseListingService } from './implementations/firebaseListingService';
 *
 * export async function initializeListingService(): Promise<IListingService> {
 *   if (listingServiceInstance) return listingServiceInstance;
 *
 *   const service = new FirebaseListingService({
 *     projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
 *     apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
 *   });
 *
 *   await service.connect();
 *   listingServiceInstance = service;
 *   return service;
 * }
 */
