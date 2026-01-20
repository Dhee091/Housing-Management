/**
 * Domain Models - Backend-Agnostic
 *
 * These models represent the core business entities independent of any storage backend.
 * They are pure TypeScript interfaces with no framework-specific code.
 *
 * This ensures portability across:
 * - Firebase (Firestore, Realtime DB)
 * - Supabase (PostgreSQL)
 * - MongoDB
 * - SQL databases
 * - REST APIs
 * - GraphQL endpoints
 */

/**
 * UserRole - Distinguishes between professional agents and individual property owners
 * @type {'agent' | 'owner'}
 */
export type UserRole = "agent" | "owner";

/**
 * Location - Represents geographic information for an apartment
 * Portable across all storage systems (embedded or referenced)
 */
export interface Location {
  /** State in Nigeria (e.g., "Lagos", "FCT") */
  state: string;

  /** City within the state (e.g., "Ikoyi", "Victoria Island") */
  city: string;

  /** Full street address */
  address: string;

  /** Optional: GPS coordinates for future map integration */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * User - Represents a lister (agent or owner)
 * Extracted from ApartmentListing to support future user-centric features
 */
export interface User {
  /** Unique identifier (UUID or database-generated ID) */
  id: string;

  /** Full name of the lister */
  name: string;

  /** User role: professional agent or individual owner */
  role: UserRole;

  /** Contact phone number */
  phone: string;

  /** Contact email address */
  email: string;

  /** Optional: Company name (only relevant for agents) */
  company?: string;
}

/**
 * ListingImage - Represents a single image in an apartment listing
 * Supports multiple image formats and cloud storage backends
 */
export interface ListingImage {
  /** Unique identifier for the image */
  id: string;

  /** Image URL (can point to any CDN, S3, Cloudinary, etc.) */
  url: string;

  /** Alt text for accessibility and SEO */
  altText: string;

  /** Display order in the gallery (0-indexed) */
  order: number;

  /** Optional: Thumbnail URL for performance optimization */
  thumbnailUrl?: string;
}

/**
 * ApartmentListing - Core domain model for a rental apartment
 *
 * This is the primary entity that all operations revolve around.
 * It contains all data needed to display and manage a listing.
 *
 * Design decisions:
 * - id is always a string (works with UUID, MongoDB ObjectId, SQL integers as strings)
 * - dates are ISO 8601 strings (universal format, database-agnostic)
 * - no nested objects except Location and User (easier to serialize/deserialize)
 * - arrays are flat structures (better for different database paradigms)
 */
export interface ApartmentListing {
  // Identifiers
  /** Unique listing ID - backend independent (UUID, MongoDB ID, etc.) */
  id: string;

  // Core listing information
  /** Property title (searchable, indexed) */
  title: string;

  /** Detailed property description */
  description: string;

  /** Monthly rent in Nigerian Naira (integer to avoid floating point issues) */
  rent: number; // Location information
  /** Location details (state, city, address, optional coordinates) */
  location: Location;

  // Media
  /** Array of listing images */
  images: ListingImage[];

  // Property specifications
  /** Number of bedrooms (0 for studios) */
  bedrooms: number;

  /** Number of bathrooms */
  bathrooms: number;

  /** Number of available units at this price point */
  unitsAvailable: number;

  // Features
  /** List of amenities (e.g., "Swimming Pool", "24/7 Security") */
  amenities: string[];

  // Lister information
  /** User who listed this property (agent or owner) */
  listedBy: User;

  // Metadata
  /** ISO 8601 timestamp when listing was created */
  createdAt: string;

  /** ISO 8601 timestamp when listing was last modified */
  updatedAt?: string;

  /** Soft delete flag (for logical deletion, database-agnostic) */
  isActive?: boolean;

  /** Optional: Listing status ("available", "rented", "pending") - for future use */
  status?: "available" | "rented" | "pending";
}

/**
 * CreateListingInput - DTO for creating a new apartment listing
 * Excludes auto-generated fields (id, createdAt, updatedAt, listedBy.id, listedBy.role)
 * The authenticated user's ID and role are injected by the service layer for security.
 * This prevents clients from listing properties under someone else's name.
 *
 * Optional lister fields (name, phone, email, company) can be provided but are not required.
 * If not provided, they should be fetched from the authentication context or user profile.
 */
export interface CreateListingInput {
  title: string;
  description: string;
  rent: number;
  location: Location;
  images: Omit<ListingImage, "id">[];
  bedrooms: number;
  bathrooms: number;
  unitsAvailable: number;
  amenities: string[];

  // Optional lister details (authenticated user's ID and role are set by the service)
  listedByName?: string;
  listedByPhone?: string;
  listedByEmail?: string;
  listedByCompany?: string;
}

/**
 * UpdateListingInput - DTO for updating an existing apartment listing
 * All fields are optional to support partial updates
 */
export interface UpdateListingInput {
  title?: string;
  description?: string;
  rent?: number;
  location?: Location;
  images?: ListingImage[];
  bedrooms?: number;
  bathrooms?: number;
  unitsAvailable?: number;
  amenities?: string[];
  status?: "available" | "rented" | "pending";
  isActive?: boolean;
}

/**
 * PaginatedResult - Generic pagination wrapper for future scalability
 * Supports cursor-based and offset-based pagination strategies
 *
 * @template T - The type of items in the result set
 *
 * Design:
 * - Works with any listing backend (SQL offset/limit, Firebase cursor, etc.)
 * - Includes metadata for UI pagination controls
 * - nextCursor allows efficient cursor-based pagination (recommended for large datasets)
 */
export interface PaginatedResult<T> {
  /** Array of items in the current page/batch */
  items: T[];

  /** Total number of items matching the query (may be approximate in some backends) */
  total: number;

  /** Current page number (1-indexed, 0 if using cursor-based pagination) */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of pages (calculated: Math.ceil(total / pageSize)) */
  totalPages: number;

  /** Cursor for fetching the next batch (used with cursor-based pagination) */
  nextCursor?: string | null;

  /** Whether there are more items to fetch */
  hasMore: boolean;
}

/**
 * ListingFilters - Query parameters for listing searches
 * Database-agnostic filter structure that any backend can interpret
 */
export interface ListingFilters {
  /** Text search across title, description, location, lister name */
  searchTerm?: string;

  /** Filter by state */
  state?: string;

  /** Filter by city */
  city?: string;

  /** Maximum rent filter (₦) */
  maxRent?: number;

  /** Minimum rent filter (₦) */
  minRent?: number /** Minimum number of units available */;
  minUnitsAvailable?: number;

  /** Filter by user role ('agent' or 'owner') */
  role?: UserRole;

  /** Filter by listing status */
  status?: "available" | "rented" | "pending";

  /** Sorting field ('price', 'createdAt', etc.) */
  sortBy?: "price" | "createdAt" | "updatedAt" | "unitsAvailable";

  /** Sorting direction */
  sortOrder?: "asc" | "desc";

  /** Pagination page number */
  page?: number;

  /** Items per page */
  pageSize?: number;
}

/**
 * ServiceError - Standardized error interface for the service layer
 * Ensures consistent error handling across all backends
 */
export interface ServiceError extends Error {
  code: string; // 'NOT_FOUND', 'VALIDATION_ERROR', 'UNAUTHORIZED', etc.
  statusCode: number; // HTTP-like status codes for consistency
  details?: Record<string, any>;
}
