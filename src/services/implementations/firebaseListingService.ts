/**
 * FirebaseListingService - Firestore + Firebase Storage Implementation
 *
 * This service implements IListingService using:
 * - Firestore for document storage (collections: listings, images metadata)
 * - Firebase Storage for image files
 *
 * Architecture:
 * - All Firebase imports are isolated in this file
 * - Domain models are mapped from Firestore documents
 * - No Firebase types leak into the rest of the application
 * - Full pagination, filtering, and sorting with Firestore constraints
 *
 * Firestore Structure:
 * ├── listings (collection)
 * │   └── {id} (document)
 * │       ├── title: string
 * │       ├── description: string
 * │       ├── rent: number
 * │       ├── location: {state, city, address, coordinates?}
 * │       ├── bedrooms: number
 * │       ├── bathrooms: number
 * │       ├── unitsAvailable: number
 * │       ├── amenities: string[]
 * │       ├── images: {id, url, altText, order, thumbnailUrl?}[]
 * │       ├── listedBy: {id, name, role, phone, email, company?}
 * │       ├── status: 'available'|'pending'|'rented'
 * │       ├── isActive: boolean
 * │       ├── createdAt: timestamp
 * │       └── updatedAt: timestamp
 * │
 * └── images (collection, optional metadata cache)
 *     └── {id} (document for image metadata)
 */

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  type QueryConstraint,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import type {
  ApartmentListing,
  CreateListingInput,
  UpdateListingInput,
  PaginatedResult,
  ListingFilters,
  ServiceError,
  ListingImage,
  User,
} from "../../models/domain";
import type { IListingService, ServiceConfig } from "../types";

/**
 * Type alias for Firestore document data
 * Represents how documents are stored in Firestore (with timestamps as Firestore Timestamps)
 * Note: The document ID is stored separately as the document key in Firestore
 */
interface FirestoreListingDocument extends Omit<
  ApartmentListing,
  "createdAt" | "updatedAt" | "id"
> {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FirebaseListingService implements IListingService {
  private db = getFirestore();
  private storage = getStorage();
  private config: ServiceConfig;
  private LISTINGS_COLLECTION = "listings";

  constructor(config: ServiceConfig = {}) {
    this.config = {
      defaultPageSize: 20,
      enableLogging: false,
      ...config,
    };
    this.log("FirebaseListingService initialized");
  }

  /**
   * Create a new apartment listing with images
   *
   * Process:
   * 1. Generate unique ID for listing
   * 2. Upload images to Firebase Storage (if provided)
   * 3. Get download URLs for images
   * 4. Create Firestore document with image references
   * 5. Return complete listing with IDs and timestamps
   *
   * Security:
   * - authenticatedUserId and userRole are set by the backend
   * - Client-provided listedBy data is ignored
   * - Ensures users can only list properties under their own ID and role
   *
   * Error handling:
   * - Validation errors: throw ServiceError with code='VALIDATION_ERROR'
   * - Storage upload failures: throw ServiceError with code='STORAGE_ERROR'
   * - Firestore failures: throw ServiceError with code='DATABASE_ERROR'
   */
  async createListing(
    data: Omit<CreateListingInput, "listedBy">,
    authenticatedUserId: string,
    userRole: "agent" | "owner",
  ): Promise<ApartmentListing> {
    this.log("createListing", { title: data.title, authenticatedUserId });

    try {
      // Generate unique ID (Firestore auto-ID style)
      const listingId = this.generateId();
      const now = Timestamp.now();

      // Process images: upload to Storage and get URLs
      const processedImages = await this.processImages(data.images, listingId);

      // Build listedBy object from authenticated user (cannot be overridden by client)
      // This ensures the listing is always attributed to the authenticated user
      const listedBy: User = {
        id: authenticatedUserId,
        name: data.listedByName || "Unknown User",
        role: userRole,
        phone: data.listedByPhone || "",
        email: data.listedByEmail || "",
        company: data.listedByCompany,
      };

      // Build Firestore document
      const firestoreDoc: FirestoreListingDocument = {
        title: data.title,
        description: data.description,
        rent: data.rent,
        location: data.location,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        unitsAvailable: data.unitsAvailable,
        amenities: data.amenities,
        images: processedImages,
        listedBy,
        status: "available",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      // Write to Firestore
      await setDoc(
        doc(this.db, this.LISTINGS_COLLECTION, listingId),
        firestoreDoc as FirestoreListingDocument,
      );

      // Return domain model
      return this.mapFirestoreToListing(listingId, firestoreDoc);
    } catch (error) {
      throw this.createServiceError(
        "DATABASE_ERROR",
        500,
        `Failed to create listing: ${this.extractErrorMessage(error)}`,
        { originalError: error },
      );
    }
  }

  /**
   * Fetch listings with advanced filtering, sorting, and pagination
   *
   * Supported filters:
   * - searchTerm: Full-text search (title, description, city, state, lister name)
   * - state: Filter by state
   * - city: Filter by city
   * - minRent, maxRent: Price range
   * - minUnitsAvailable: Minimum units available
   * - role: Filter by lister role ('agent' or 'owner')
   * - status: Filter by listing status
   * - sortBy: Sort field (rent, createdAt, updatedAt, unitsAvailable)
   * - sortOrder: 'asc' or 'desc'
   * - page, pageSize: Pagination
   *
   * Firestore constraints:
   * - Queries must filter on indexed fields first
   * - Sorting after filtering
   * - Pagination with limit + offset
   *
   * Note: Full-text search (searchTerm) is done in-memory post-query
   * For production, integrate Algolia, Typesense, or Firestore's vector search
   */
  async getListings(
    filters?: ListingFilters,
  ): Promise<PaginatedResult<ApartmentListing>> {
    this.log("getListings", { filters });

    try {
      // Build Firestore query constraints
      const constraints: QueryConstraint[] = [
        where("isActive", "==", true), // Always filter active listings
      ];

      // Add location filters (use compound indexes if combining)
      if (filters?.state) {
        constraints.push(where("location.state", "==", filters.state));
      }

      if (filters?.city) {
        constraints.push(where("location.city", "==", filters.city));
      }

      // Add price range filters
      if (filters?.minRent !== undefined) {
        constraints.push(where("rent", ">=", filters.minRent));
      }
      if (filters?.maxRent !== undefined) {
        constraints.push(where("rent", "<=", filters.maxRent));
      }

      // Add units filter
      if (filters?.minUnitsAvailable !== undefined) {
        constraints.push(
          where("unitsAvailable", ">=", filters.minUnitsAvailable),
        );
      }

      // Add status filter
      if (filters?.status) {
        constraints.push(where("status", "==", filters.status));
      }

      // Add role filter (filter by lister role)
      if (filters?.role) {
        constraints.push(where("listedBy.role", "==", filters.role));
      }

      // Add sorting
      const sortBy = filters?.sortBy || "createdAt";
      const sortOrder =
        (filters?.sortOrder as "asc" | "desc" | undefined) || "desc";
      constraints.push(orderBy(sortBy, sortOrder));

      // First query without pagination to get total count
      const baseQuery = query(
        collection(this.db, this.LISTINGS_COLLECTION),
        ...constraints,
      );

      const allDocsSnapshot = await getDocs(baseQuery);
      const allItems = allDocsSnapshot.docs;

      // Apply in-memory search filter (searchTerm requires full-text search)
      let filteredItems = allItems;
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredItems = allItems.filter(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as FirestoreListingDocument;
            return (
              data.title.toLowerCase().includes(searchLower) ||
              data.description.toLowerCase().includes(searchLower) ||
              data.location.city.toLowerCase().includes(searchLower) ||
              data.location.state.toLowerCase().includes(searchLower) ||
              data.listedBy.name.toLowerCase().includes(searchLower)
            );
          },
        );
      }

      // Apply pagination
      const pageSize = filters?.pageSize || this.config.defaultPageSize || 20;
      const page = Math.max(1, filters?.page || 1);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedDocs = filteredItems.slice(startIndex, endIndex);
      const total = filteredItems.length;
      const totalPages = Math.ceil(total / pageSize);

      // Map to domain models
      const items = paginatedDocs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) =>
          this.mapFirestoreToListing(
            doc.id,
            doc.data() as FirestoreListingDocument,
          ),
      );

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
        nextCursor: page < totalPages ? String(page + 1) : null,
      };
    } catch (error) {
      throw this.createServiceError(
        "DATABASE_ERROR",
        500,
        `Failed to fetch listings: ${this.extractErrorMessage(error)}`,
        { originalError: error },
      );
    }
  }

  /**
   * Fetch a single listing by ID
   *
   * Returns the complete listing with all nested data
   * Throws NOT_FOUND error if listing doesn't exist
   */
  async getListingById(id: string): Promise<ApartmentListing> {
    this.log("getListingById", { id });

    try {
      const docSnapshot = await getDoc(
        doc(this.db, this.LISTINGS_COLLECTION, id),
      );

      if (!docSnapshot.exists()) {
        throw this.createServiceError(
          "NOT_FOUND",
          404,
          `Listing with ID ${id} not found`,
        );
      }

      const data = docSnapshot.data() as FirestoreListingDocument;
      return this.mapFirestoreToListing(id, data);
    } catch (error) {
      if (this.isServiceError(error)) throw error;

      throw this.createServiceError(
        "DATABASE_ERROR",
        500,
        `Failed to fetch listing: ${this.extractErrorMessage(error)}`,
        { originalError: error },
      );
    }
  }

  /**
   * Update an existing listing
   *
   * Process:
   * 1. Fetch existing listing
   * 2. Merge updates with existing data
   * 3. Handle image updates (delete old, upload new)
   * 4. Update Firestore document
   * 5. Return updated listing
   *
   * Preserves:
   * - ID (never changes)
   * - createdAt (never changes)
   * - Updates updatedAt timestamp
   */
  async updateListing(
    id: string,
    data: UpdateListingInput,
  ): Promise<ApartmentListing> {
    this.log("updateListing", { id });

    try {
      // Fetch existing listing
      const docSnapshot = await getDoc(
        doc(this.db, this.LISTINGS_COLLECTION, id),
      );

      if (!docSnapshot.exists()) {
        throw this.createServiceError(
          "NOT_FOUND",
          404,
          `Listing with ID ${id} not found`,
        );
      }

      const existing = docSnapshot.data() as FirestoreListingDocument;

      // Handle image updates if provided
      let processedImages = existing.images;
      if (data.images !== undefined) {
        // Delete old images from Storage
        await Promise.all(
          existing.images.map((img) =>
            this.deleteImageFromStorage(img.url).catch(() => {
              // Silently fail if image doesn't exist
            }),
          ),
        );

        // Upload new images
        processedImages = await this.processImages(data.images, id);
      }

      // Prepare update payload
      const updatePayload = {
        ...data,
        ...(data.images !== undefined && { images: processedImages }),
        updatedAt: Timestamp.now(),
      };

      // Update Firestore document
      await updateDoc(
        doc(this.db, this.LISTINGS_COLLECTION, id),
        updatePayload,
      );

      // Fetch and return updated document
      return this.getListingById(id);
    } catch (error) {
      if (this.isServiceError(error)) throw error;

      throw this.createServiceError(
        "DATABASE_ERROR",
        500,
        `Failed to update listing: ${this.extractErrorMessage(error)}`,
        { originalError: error },
      );
    }
  }

  /**
   * Delete a listing (soft delete)
   *
   * Process:
   * 1. Fetch listing
   * 2. Delete all images from Storage
   * 3. Mark as inactive in Firestore (soft delete)
   *
   * Soft delete means the document remains in Firestore but is hidden
   * from queries (isActive = false). This preserves history and references.
   */
  async deleteListing(id: string): Promise<void> {
    this.log("deleteListing", { id });

    try {
      const docSnapshot = await getDoc(
        doc(this.db, this.LISTINGS_COLLECTION, id),
      );

      if (!docSnapshot.exists()) {
        throw this.createServiceError(
          "NOT_FOUND",
          404,
          `Listing with ID ${id} not found`,
        );
      }

      const data = docSnapshot.data() as FirestoreListingDocument;

      // Delete images from Storage
      await Promise.all(
        data.images.map((img) =>
          this.deleteImageFromStorage(img.url).catch(() => {
            // Silently fail if image doesn't exist
          }),
        ),
      );

      // Soft delete: mark as inactive
      await updateDoc(doc(this.db, this.LISTINGS_COLLECTION, id), {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      if (this.isServiceError(error)) throw error;

      throw this.createServiceError(
        "DATABASE_ERROR",
        500,
        `Failed to delete listing: ${this.extractErrorMessage(error)}`,
        { originalError: error },
      );
    }
  }

  /**
   * Search listings by query term
   *
   * Convenience method that combines full-text search with filters
   * Uses getListings internally with searchTerm filter
   */
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

  /**
   * Get listings by a specific user (lister)
   *
   * Process:
   * 1. Query listings where listedBy.id matches userId
   * 2. Apply additional filters
   * 3. Return paginated results
   */
  async getListingsByUser(
    userId: string,
    filters?: ListingFilters,
  ): Promise<PaginatedResult<ApartmentListing>> {
    this.log("getListingsByUser", { userId });

    try {
      // Build constraints with user filter
      const constraints: QueryConstraint[] = [
        where("listedBy.id", "==", userId),
        where("isActive", "==", true),
      ];

      // Add optional filters
      if (filters?.status) {
        constraints.push(where("status", "==", filters.status));
      }

      if (filters?.maxRent !== undefined) {
        constraints.push(where("rent", "<=", filters.maxRent));
      }

      // Add sorting
      const sortBy = filters?.sortBy || "createdAt";
      const sortOrder =
        (filters?.sortOrder as "asc" | "desc" | undefined) || "desc";
      constraints.push(orderBy(sortBy, sortOrder));

      // Execute query
      const baseQuery = query(
        collection(this.db, this.LISTINGS_COLLECTION),
        ...constraints,
      );

      const allDocsSnapshot = await getDocs(baseQuery);
      const allItems = allDocsSnapshot.docs;

      // Apply search filter if provided
      let filteredItems = allItems;
      if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredItems = allItems.filter(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as FirestoreListingDocument;
            return (
              data.title.toLowerCase().includes(searchLower) ||
              data.description.toLowerCase().includes(searchLower)
            );
          },
        );
      }

      // Apply pagination
      const pageSize = filters?.pageSize || this.config.defaultPageSize || 20;
      const page = Math.max(1, filters?.page || 1);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      const paginatedDocs = filteredItems.slice(startIndex, endIndex);
      const total = filteredItems.length;
      const totalPages = Math.ceil(total / pageSize);

      // Map to domain models
      const items = paginatedDocs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) =>
          this.mapFirestoreToListing(
            doc.id,
            doc.data() as FirestoreListingDocument,
          ),
      );

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
        nextCursor: page < totalPages ? String(page + 1) : null,
      };
    } catch (error) {
      throw this.createServiceError(
        "DATABASE_ERROR",
        500,
        `Failed to fetch user listings: ${this.extractErrorMessage(error)}`,
        { originalError: error },
      );
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Process images: upload to Firebase Storage and return ListingImage objects with URLs
   *
   * Flow:
   * 1. Check if image is File (new upload) or already uploaded (URL)
   * 2. For Files: upload to Storage at /listings/{listingId}/{imageId}
   * 3. Get download URL from Firebase
   * 4. Return ListingImage objects with metadata
   */
  private async processImages(
    images: any[],
    listingId: string,
  ): Promise<ListingImage[]> {
    const processed: ListingImage[] = [];

    for (let index = 0; index < images.length; index++) {
      const image = images[index];

      // If it's already a ListingImage with URL, keep it as-is
      if ("url" in image && "id" in image) {
        processed.push(image);
        continue;
      }

      // If it's a File, upload it
      if (image instanceof File) {
        try {
          const imageId = this.generateId();
          const storageRef = ref(
            this.storage,
            `listings/${listingId}/${imageId}`,
          );

          // Upload file
          const snapshot = await uploadBytes(storageRef, image);

          // Get download URL
          const downloadUrl = await getDownloadURL(snapshot.ref);

          processed.push({
            id: imageId,
            url: downloadUrl,
            altText: image.name,
            order: index,
            thumbnailUrl: downloadUrl, // In production, generate actual thumbnail
          });
        } catch (error) {
          throw this.createServiceError(
            "STORAGE_ERROR",
            500,
            `Failed to upload image: ${this.extractErrorMessage(error)}`,
            { originalError: error },
          );
        }
      }
    }

    return processed;
  }

  /**
   * Delete image from Firebase Storage by URL
   * Extracts file path from download URL and deletes it
   */
  private async deleteImageFromStorage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from Firebase Storage download URL
      // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
      const urlParts = imageUrl.split("/o/");
      if (urlParts.length < 2) return; // Not a Firebase URL, skip

      const pathAndQuery = urlParts[1];
      const filePath = decodeURIComponent(pathAndQuery.split("?")[0]);

      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);
    } catch (error) {
      // Silently fail - image might already be deleted
      this.log("deleteImageFromStorage failed", { imageUrl, error });
    }
  }

  /**
   * Map Firestore document to domain model ApartmentListing
   * Handles timestamp conversion from Firestore Timestamp to ISO string
   */
  private mapFirestoreToListing(
    id: string,
    doc: FirestoreListingDocument,
  ): ApartmentListing {
    return {
      id,
      title: doc.title,
      description: doc.description,
      rent: doc.rent,
      location: doc.location,
      bedrooms: doc.bedrooms,
      bathrooms: doc.bathrooms,
      unitsAvailable: doc.unitsAvailable,
      amenities: doc.amenities,
      images: doc.images,
      listedBy: doc.listedBy,
      status: doc.status,
      isActive: doc.isActive,
      createdAt: doc.createdAt.toDate().toISOString(),
      updatedAt: doc.updatedAt.toDate().toISOString(),
    };
  }

  /**
   * Generate a unique ID similar to Firestore's auto-ID
   * Used for listings and images
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create standardized ServiceError
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
   * Type guard to check if error is a ServiceError
   */
  private isServiceError(error: any): error is ServiceError {
    return (
      error &&
      typeof error === "object" &&
      "code" in error &&
      "statusCode" in error
    );
  }

  /**
   * Extract readable error message from various error types
   */
  private extractErrorMessage(error: any): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return String(error);
  }

  /**
   * Logging utility respecting enableLogging config
   */
  private log(method: string, data?: any): void {
    if (this.config.enableLogging) {
      console.log(`[FirebaseListingService.${method}]`, data);
    }
  }
}
