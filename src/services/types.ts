/**
 * Service Layer Interface - IListingService
 *
 * This interface defines the contract for listing operations.
 * Any backend implementation must adhere to this contract.
 * The UI only depends on this interface, never on concrete implementations.
 *
 * Benefits:
 * - Backend-agnostic: swap implementations without changing UI code
 * - Testable: easily mock for unit tests
 * - Clear contracts: explicit what the service provides
 * - Type-safe: full TypeScript support
 */

import type {
  ApartmentListing,
  CreateListingInput,
  UpdateListingInput,
  PaginatedResult,
  ListingFilters,
} from "../models/domain";
import type { AuthUser } from "./auth/authService";

/**
 * IListingService - Service interface for apartment listing operations
 *
 * Implementation pattern: All methods are async to support network calls,
 * even if the current mock implementation is synchronous.
 * This ensures future backend migration requires no UI code changes.
 */
export interface IListingService {
  /**
   * Fetch all listings with optional filtering and pagination
   *
   * @param filters - Query filters (search, location, price, sorting, pagination)
   * @returns Promise resolving to paginated listings
   * @throws ServiceError if query fails
   *
   * Example:
   * ```typescript
   * const results = await listingsService.getListings({
   *   searchTerm: 'ikoyi',
   *   maxPrice: 500000,
   *   page: 1,
   *   pageSize: 20,
   *   sortBy: 'price',
   *   sortOrder: 'asc'
   * });
   * ```
   */
  getListings(
    filters?: ListingFilters,
  ): Promise<PaginatedResult<ApartmentListing>>;

  /**
   * Fetch a single listing by ID
   *
   * @param id - Listing ID
   * @returns Promise resolving to the listing
   * @throws ServiceError with code='NOT_FOUND' if listing doesn't exist
   *
   * Example:
   * ```typescript
   * const listing = await listingsService.getListingById('apt-123');
   * ```
   */
  getListingById(id: string): Promise<ApartmentListing>;

  /**
   * Create a new apartment listing
   *
   * @param data - Listing data without id, createdAt, updatedAt, listedBy
   * @param authenticatedUserId - The authenticated user's ID (required for security)
   * @param userRole - The authenticated user's role (required for security)
   * @returns Promise resolving to the created listing with generated id and timestamps
   * @throws ServiceError if validation fails or creation fails
   *
   * Security note: authenticatedUserId and userRole are set by the backend and cannot
   * be overridden by client input. The listedBy field in data is ignored.
   *
   * Example:
   * ```typescript
   * const { currentUser, userRole } = useAuth();
   * const newListing = await listingsService.createListing(
   *   {
   *     title: "Modern 3-Bed in Ikoyi",
   *     rent: 500000,
   *     // ... other required fields
   *     // NOTE: listedBy field is ignored, user info comes from authentication
   *   },
   *   currentUser!.uid,
   *   userRole!
   * );
   * ```
   */
  createListing(
    data: Omit<CreateListingInput, "listedBy">,
    authenticatedUserId: string,
    userRole: "agent" | "owner",
  ): Promise<ApartmentListing>;

  /**
   * Update an existing apartment listing
   *
   * Security:
   * - Optional ownership verification if currentUser is provided
   * - Throws FORBIDDEN error if user is not owner or admin
   *
   * @param id - Listing ID
   * @param data - Partial listing data to update
   * @param currentUser - (Optional) Authenticated user for ownership verification
   * @param userRole - (Optional) User's role to check admin status
   * @returns Promise resolving to the updated listing
   * @throws ServiceError with code='NOT_FOUND' if listing doesn't exist
   * @throws ServiceError with code='FORBIDDEN' if user is not owner or admin
   *
   * Example:
   * ```typescript
   * const { currentUser, userRole } = useAuth();
   * const updated = await listingsService.updateListing(
   *   'apt-123',
   *   { rent: 550000, unitsAvailable: 1 },
   *   currentUser,
   *   userRole
   * );
   * ```
   */
  updateListing(
    id: string,
    data: UpdateListingInput,
    currentUser?: AuthUser,
    userRole?: "agent" | "owner" | "admin",
  ): Promise<ApartmentListing>;

  /**
   * Delete a listing by ID
   *
   * Security:
   * - Optional ownership verification if currentUser is provided
   * - Throws FORBIDDEN error if user is not owner or admin
   * - Uses soft delete (marks as inactive) to preserve history
   *
   * @param id - Listing ID
   * @param currentUser - (Optional) Authenticated user for ownership verification
   * @param userRole - (Optional) User's role to check admin status
   * @returns Promise that resolves when deletion is complete
   * @throws ServiceError with code='NOT_FOUND' if listing doesn't exist
   * @throws ServiceError with code='FORBIDDEN' if user is not owner or admin
   *
   * Example:
   * ```typescript
   * const { currentUser, userRole } = useAuth();
   * await listingsService.deleteListing('apt-123', currentUser, userRole);
   * ```
   */
  deleteListing(
    id: string,
    currentUser?: AuthUser,
    userRole?: "agent" | "owner" | "admin",
  ): Promise<void>;

  /**
   * Search listings with full-text search capability
   *
   * This is a convenience method that combines common search patterns.
   * Internally calls getListings with appropriate filters.
   *
   * @param query - Search query (searches title, description, location, lister name)
   * @param filters - Additional filters to apply
   * @returns Promise resolving to paginated results
   *
   * Example:
   * ```typescript
   * const results = await listingsService.search('ikoyi apartment', {
   *   maxPrice: 500000
   * });
   * ```
   */
  search(
    query: string,
    filters?: Omit<ListingFilters, "searchTerm">,
  ): Promise<PaginatedResult<ApartmentListing>>;

  /**
   * Get listings by a specific user (agent or owner)
   *
   * @param userId - The user ID
   * @param filters - Additional filters (pagination, sorting, etc.)
   * @returns Promise resolving to paginated listings by this user
   *
   * Example:
   * ```typescript
   * const agentListings = await listingsService.getListingsByUser('user-456');
   * ```
   */
  getListingsByUser(
    userId: string,
    filters?: ListingFilters,
  ): Promise<PaginatedResult<ApartmentListing>>;
}

/**
 * ServiceConfig - Configuration for service implementations
 * Allows customization without changing the interface
 *
 * Different backends can have different config structures,
 * but all implement IListingService consistently.
 */
export interface ServiceConfig {
  /** Maximum results per page */
  defaultPageSize?: number;

  /** Whether to enable caching */
  enableCache?: boolean;

  /** Cache TTL in milliseconds */
  cacheTTL?: number;

  /** Logging enabled */
  enableLogging?: boolean;
}
