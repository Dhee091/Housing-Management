/**
 * MockListingService - In-Memory Implementation
 *
 * This is the concrete implementation used during MVP and early development.
 *
 * Design:
 * - Uses in-memory storage (mockData converted to domain models)
 * - Implements full async interface for seamless future migration
 * - Includes pagination, filtering, and search logic
 * - Ready to be swapped with Firebase, Supabase, or REST API implementation
 *
 * When migrating to a real backend:
 * 1. Create FirebaseListingService or SupabaseListingService
 * 2. Implement the same IListingService interface
 * 3. Update the service factory (listingsService.ts) to use new implementation
 * 4. No UI code changes required
 */

import type {
  ApartmentListing,
  CreateListingInput,
  UpdateListingInput,
  PaginatedResult,
  ListingFilters,
  ServiceError,
} from "../../models/domain";
import type { IListingService, ServiceConfig } from "../types";
import type { AuthUser } from "../auth/authService";

/**
 * In-memory data store
 * In production, this is replaced by actual database queries
 */
let apartmentListings: Map<string, ApartmentListing> = new Map();

/**
 * Counter for generating unique IDs
 * In production, backends generate these automatically
 */
let idCounter = 1;

export class MockListingService implements IListingService {
  private config: ServiceConfig;

  constructor(config: ServiceConfig = {}) {
    this.config = {
      defaultPageSize: 20,
      enableLogging: false,
      ...config,
    };
  }

  /**
   * Initialize service with mock data
   * Called once during app startup to populate listings
   * In production, this is replaced by database queries
   */
  initializeWithMockData(listings: ApartmentListing[]): void {
    apartmentListings.clear();
    idCounter = 1;
    listings.forEach((listing) => {
      apartmentListings.set(listing.id, listing);
    });
    if (this.config.enableLogging) {
      console.log(
        `[ListingService] Initialized with ${listings.length} listings`,
      );
    }
  }

  async getListings(
    filters?: ListingFilters,
  ): Promise<PaginatedResult<ApartmentListing>> {
    this.log("getListings", filters);

    // Convert Map to array
    let results = Array.from(apartmentListings.values());

    // Apply active filter
    results = results.filter((apt) => apt.isActive !== false);

    // Apply search term
    if (filters?.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      results = results.filter(
        (apt) =>
          apt.title.toLowerCase().includes(query) ||
          apt.description.toLowerCase().includes(query) ||
          apt.location.city.toLowerCase().includes(query) ||
          apt.location.state.toLowerCase().includes(query) ||
          apt.listedBy.name.toLowerCase().includes(query),
      );
    }

    // Apply location filters
    if (filters?.state) {
      results = results.filter((apt) => apt.location.state === filters.state);
    }
    if (filters?.city) {
      results = results.filter((apt) => apt.location.city === filters.city);
    }

    // Apply price filters
    if (filters?.minRent !== undefined) {
      results = results.filter((apt) => apt.rent >= filters.minRent!);
    }
    if (filters?.maxRent !== undefined) {
      results = results.filter((apt) => apt.rent <= filters.maxRent!);
    }

    // Apply units available filter
    if (filters?.minUnitsAvailable !== undefined) {
      results = results.filter(
        (apt) => apt.unitsAvailable >= filters.minUnitsAvailable!,
      );
    }

    // Apply role filter
    if (filters?.role) {
      results = results.filter((apt) => apt.listedBy.role === filters.role);
    }

    // Apply status filter
    if (filters?.status) {
      results = results.filter((apt) => apt.status === filters.status);
    }

    // Apply sorting
    const sortBy = filters?.sortBy || "createdAt";
    const sortOrder = filters?.sortOrder || "desc";

    results.sort((a, b) => {
      let aValue: any = a[sortBy as keyof ApartmentListing];
      let bValue: any = b[sortBy as keyof ApartmentListing];

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const pageSize = filters?.pageSize || this.config.defaultPageSize || 20;
    const page = Math.max(1, filters?.page || 1);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = results.slice(startIndex, endIndex);
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
      nextCursor: page < totalPages ? String(page + 1) : null,
    };
  }

  async getListingById(id: string): Promise<ApartmentListing> {
    this.log("getListingById", { id });

    const listing = apartmentListings.get(id);
    if (!listing) {
      throw this.createServiceError(
        "NOT_FOUND",
        404,
        `Listing with ID ${id} not found`,
      );
    }

    return listing;
  }

  async createListing(
    data: Omit<CreateListingInput, "listedBy">,
    authenticatedUserId: string,
    userRole: "agent" | "owner",
  ): Promise<ApartmentListing> {
    this.log("createListing", { title: data.title, authenticatedUserId });

    const id = `apt-${idCounter++}`;
    const now = new Date().toISOString();

    // Add IDs to images
    const imagesWithIds = data.images.map((img, index) => ({
      ...img,
      id: `img-${id}-${index}`,
    }));

    // Build listedBy from authenticated user (cannot be overridden by client)
    const listedBy = {
      id: authenticatedUserId,
      name: data.listedByName || "Unknown User",
      role: userRole,
      phone: data.listedByPhone || "",
      email: data.listedByEmail || "",
      company: data.listedByCompany,
    };

    const newListing: ApartmentListing = {
      title: data.title,
      description: data.description,
      rent: data.rent,
      location: data.location,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      unitsAvailable: data.unitsAvailable,
      amenities: data.amenities,
      images: imagesWithIds,
      listedBy,
      id,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      status: "available",
    };

    apartmentListings.set(id, newListing);
    return newListing;
  }

  async updateListing(
    id: string,
    data: UpdateListingInput,
    currentUser?: AuthUser,
    userRole?: "agent" | "owner" | "admin",
  ): Promise<ApartmentListing> {
    this.log("updateListing", { id, userId: currentUser?.uid });

    const existing = apartmentListings.get(id);
    if (!existing) {
      throw this.createServiceError(
        "NOT_FOUND",
        404,
        `Listing with ID ${id} not found`,
      );
    }

    // Check ownership if current user is provided
    if (currentUser) {
      this.assertListingOwnership(existing, currentUser, userRole);
    }

    const updated: ApartmentListing = {
      ...existing,
      ...data,
      id: existing.id, // Prevent ID modification
      createdAt: existing.createdAt, // Prevent creation date modification
      updatedAt: new Date().toISOString(),
    };

    apartmentListings.set(id, updated);
    return updated;
  }

  async deleteListing(
    id: string,
    currentUser?: AuthUser,
    userRole?: "agent" | "owner" | "admin",
  ): Promise<void> {
    this.log("deleteListing", { id, userId: currentUser?.uid });

    const listing = apartmentListings.get(id);
    if (!listing) {
      throw this.createServiceError(
        "NOT_FOUND",
        404,
        `Listing with ID ${id} not found`,
      );
    }

    // Check ownership if current user is provided
    if (currentUser) {
      this.assertListingOwnership(listing, currentUser, userRole);
    }

    // Soft delete: mark as inactive instead of removing
    apartmentListings.set(id, {
      ...listing,
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  }

  async search(
    query: string,
    filters?: Omit<ListingFilters, "searchTerm">,
  ): Promise<PaginatedResult<ApartmentListing>> {
    this.log("search", { query });

    return this.getListings({
      ...filters,
      searchTerm: query,
    });
  }

  async getListingsByUser(
    userId: string,
    filters?: ListingFilters,
  ): Promise<PaginatedResult<ApartmentListing>> {
    this.log("getListingsByUser", { userId });

    // Filter by user ID instead of by role
    let results = Array.from(apartmentListings.values());
    results = results.filter(
      (apt) => apt.listedBy.id === userId && apt.isActive !== false,
    );

    // Apply additional filters
    if (filters?.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      results = results.filter(
        (apt) =>
          apt.title.toLowerCase().includes(query) ||
          apt.description.toLowerCase().includes(query),
      );
    }

    if (filters?.maxRent !== undefined) {
      results = results.filter((apt) => apt.rent <= filters.maxRent!);
    }

    // Apply sorting and pagination
    const sortBy = filters?.sortBy || "createdAt";
    const sortOrder = filters?.sortOrder || "desc";

    results.sort((a, b) => {
      let aValue: any = a[sortBy as keyof ApartmentListing];
      let bValue: any = b[sortBy as keyof ApartmentListing];

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const pageSize = filters?.pageSize || this.config.defaultPageSize || 20;
    const page = Math.max(1, filters?.page || 1);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = results.slice(startIndex, endIndex);
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
      nextCursor: page < totalPages ? String(page + 1) : null,
    };
  }

  /**
   * Verify that the current user owns the listing or is an admin
   *
   * Security utility for updateListing and deleteListing.
   * Throws FORBIDDEN error if user is neither the listing owner nor an admin.
   *
   * @param listing - The apartment listing
   * @param currentUser - Authenticated user making the request
   * @param userRole - User's role (to check admin status)
   * @throws ServiceError with code='FORBIDDEN' if ownership check fails
   *
   * Access rules:
   * - Listing owner (listedBy.id === currentUser.uid) can access
   * - Admin users can access any listing
   * - All others are denied
   */
  private assertListingOwnership(
    listing: ApartmentListing,
    currentUser: AuthUser,
    userRole?: "agent" | "owner" | "admin",
  ): void {
    const isOwner = listing.listedBy.id === currentUser.uid;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      throw this.createServiceError(
        "FORBIDDEN",
        403,
        `You do not have permission to modify this listing. Only the listing owner or admins can perform this action.`,
        {
          listingId: listing.id,
          listingOwner: listing.listedBy.id,
          currentUser: currentUser.uid,
          userRole,
        },
      );
    }
  }

  /**
   * Helper method to create standardized ServiceError
   * Consistent error handling across all methods
   */
  private createServiceError(
    code: string,
    statusCode: number,
    message: string,
    details?: Record<string, any>,
  ): ServiceError {
    const error = new Error(message) as ServiceError;
    error.code = code;
    error.statusCode = statusCode;
    error.details = details;
    return error;
  }

  /**
   * Logging utility - respects enableLogging config
   */
  private log(method: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[MockListingService.${method}]`, data);
    }
  }
}
