/**
 * Firebase Storage Service
 *
 * Utility functions for managing listing images in Firebase Storage.
 * Handles file validation, uploads, and download URL generation.
 *
 * Architecture:
 * - Backend-agnostic validation types
 * - Concrete Firebase implementation
 * - Client-side file validation (server-side enforced via Firestore rules)
 * - Automatic error handling and cleanup on failure
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { getFirebaseStorage } from "../../config/firebase";
import type { AuthUser } from "../auth/authService";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration for file validation
 */
export interface FileValidationConfig {
  /** Allowed MIME types (e.g., 'image/jpeg', 'image/png') */
  allowedTypes: string[];

  /** Maximum file size in bytes */
  maxSize: number;

  /** File type error message */
  typeError: string;

  /** File size error message */
  sizeError: string;
}

/**
 * Result of uploading a single image
 */
export interface UploadedImage {
  /** Generated unique ID for the image in storage */
  id: string;

  /** Download URL for accessing the image */
  url: string;

  /** Alt text (can be set later) */
  altText: string;

  /** Display order in gallery */
  order: number;
}

/**
 * Error that can occur during image upload
 */
export interface StorageError {
  /** Error code from Firebase or validation */
  code: "INVALID_FILE_TYPE" | "FILE_TOO_LARGE" | "UPLOAD_FAILED" | "UNKNOWN";

  /** Human-readable error message */
  message: string;

  /** Original error for debugging */
  originalError?: Error;
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Default configuration for listing image uploads
 * - Supports: JPEG, PNG, WebP
 * - Max size: 5MB per image
 * - Max count: 20 images per listing
 */
export const DEFAULT_LISTING_IMAGE_CONFIG: FileValidationConfig = {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSize: 5 * 1024 * 1024, // 5MB
  typeError: "Only JPEG, PNG, and WebP images are allowed",
  sizeError: "Image size must be less than 5MB",
};

/**
 * Maximum number of images per listing
 */
export const MAX_IMAGES_PER_LISTING = 20;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a single file against the provided configuration
 *
 * @param file - File to validate
 * @param config - Validation configuration
 * @returns null if valid, StorageError if invalid
 *
 * @example
 * ```typescript
 * const error = validateFile(file, DEFAULT_LISTING_IMAGE_CONFIG);
 * if (error) {
 *   console.error(error.message);
 * }
 * ```
 */
export function validateFile(
  file: File,
  config: FileValidationConfig,
): StorageError | null {
  // Check file type
  if (!config.allowedTypes.includes(file.type)) {
    return {
      code: "INVALID_FILE_TYPE",
      message: config.typeError,
    };
  }

  // Check file size
  if (file.size > config.maxSize) {
    return {
      code: "FILE_TOO_LARGE",
      message: config.sizeError,
    };
  }

  return null;
}

/**
 * Validate multiple files before upload
 *
 * @param files - Files to validate
 * @param config - Validation configuration
 * @returns Array of errors (empty if all files are valid)
 *
 * @example
 * ```typescript
 * const errors = validateFiles(selectedFiles, DEFAULT_LISTING_IMAGE_CONFIG);
 * if (errors.length > 0) {
 *   errors.forEach(error => console.error(error.message));
 * }
 * ```
 */
export function validateFiles(
  files: File[],
  config: FileValidationConfig = DEFAULT_LISTING_IMAGE_CONFIG,
): StorageError[] {
  const errors: StorageError[] = [];

  // Check count limit
  if (files.length > MAX_IMAGES_PER_LISTING) {
    errors.push({
      code: "UPLOAD_FAILED",
      message: `Maximum ${MAX_IMAGES_PER_LISTING} images allowed per listing`,
    });
  }

  // Validate each file
  for (const file of files) {
    const error = validateFile(file, config);
    if (error) {
      errors.push(error);
    }
  }

  return errors;
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload multiple images for a listing
 *
 * Uploads images to Firebase Storage at path: /listings/{listingId}/{imageId}
 *
 * Features:
 * - Client-side validation (type, size)
 * - Automatic error handling with cleanup on failure
 * - Returns download URLs ready for database storage
 * - Preserves original filenames in metadata for debugging
 *
 * @param listingId - The listing ID (used for organizing in storage)
 * @param files - Array of File objects from input element or drag-drop
 * @param currentUser - Authenticated user (for audit/tracking)
 * @param config - Optional validation config (uses defaults if not provided)
 * @returns Promise resolving to array of UploadedImage with download URLs
 * @throws Error if upload fails (partially uploaded files are cleaned up)
 *
 * Security Notes:
 * - Client-side validation is for UX only
 * - Server-side validation via Firestore rules is authoritative
 * - Uploaded images stored at /listings/{listingId}/{imageId}
 * - Download URLs are generated by Firebase (expires in ~2 weeks by default)
 * - Firestore rules restrict write access to image owner
 *
 * Example:
 * ```typescript
 * const handleImageUpload = async (files: File[]) => {
 *   try {
 *     const uploadedImages = await uploadListingImages(
 *       'listing-123',
 *       files,
 *       currentUser,
 *       DEFAULT_LISTING_IMAGE_CONFIG
 *     );
 *
 *     // Update listing with uploaded images
 *     setImages(uploadedImages);
 *   } catch (error) {
 *     if (error instanceof StorageError) {
 *       showError(error.message);
 *     }
 *   }
 * };
 * ```
 */
export async function uploadListingImages(
  listingId: string,
  files: File[],
  currentUser: AuthUser,
  config: FileValidationConfig = DEFAULT_LISTING_IMAGE_CONFIG,
): Promise<UploadedImage[]> {
  // Validate inputs
  if (!listingId) {
    throw new Error("listingId is required");
  }

  if (!currentUser || !currentUser.uid) {
    throw new Error("currentUser must be authenticated");
  }

  if (!files || files.length === 0) {
    return [];
  }

  // Validate files
  const validationErrors = validateFiles(files, config);
  if (validationErrors.length > 0) {
    throw validationErrors[0];
  }

  const storage = getFirebaseStorage();
  const uploadedImages: UploadedImage[] = [];
  const uploadedRefs: Array<{
    ref: ReturnType<typeof ref>;
    imageId: string;
  }> = [];

  try {
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Generate unique image ID (timestamp + random suffix)
      const imageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create reference to storage location
      const storageRef = ref(storage, `listings/${listingId}/${imageId}`);

      // Track for cleanup if needed
      uploadedRefs.push({ ref: storageRef, imageId });

      // Upload file with metadata
      await uploadBytes(storageRef, file, {
        customMetadata: {
          uploadedBy: currentUser.uid,
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name,
          listingId,
        },
      });

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Create image record
      uploadedImages.push({
        id: imageId,
        url: downloadURL,
        altText: "", // User should set this in the form
        order: i,
      });
    }

    return uploadedImages;
  } catch (error) {
    // Cleanup: delete any successfully uploaded files on error
    console.error("[Storage] Upload error, cleaning up...", error);

    for (const { ref: storageRef } of uploadedRefs) {
      try {
        await deleteObject(storageRef);
        console.log(`[Storage] Cleaned up ${storageRef.fullPath}`);
      } catch (cleanupError) {
        console.error(
          `[Storage] Failed to clean up ${storageRef.fullPath}`,
          cleanupError,
        );
      }
    }

    // Throw appropriate error
    if (error instanceof Error) {
      if (error.message.includes("validation")) {
        throw error; // Re-throw validation errors
      }
      throw {
        code: "UPLOAD_FAILED",
        message: `Upload failed: ${error.message}`,
        originalError: error,
      } as StorageError;
    }

    throw {
      code: "UNKNOWN",
      message: "An unexpected error occurred during upload",
      originalError: error instanceof Error ? error : undefined,
    } as StorageError;
  }
}

/**
 * Delete a single image from storage
 *
 * @param listingId - The listing ID containing the image
 * @param imageId - The image ID to delete
 * @returns Promise that resolves when deletion is complete
 * @throws StorageError if deletion fails
 *
 * Security: Client must be owner of listing (enforced via Firestore rules)
 *
 * Example:
 * ```typescript
 * await deleteListingImage('listing-123', 'image-id-xyz');
 * ```
 */
export async function deleteListingImage(
  listingId: string,
  imageId: string,
): Promise<void> {
  if (!listingId || !imageId) {
    throw new Error("listingId and imageId are required");
  }

  const storage = getFirebaseStorage();
  const storageRef = ref(storage, `listings/${listingId}/${imageId}`);

  try {
    await deleteObject(storageRef);
  } catch (error) {
    if (error instanceof Error) {
      throw {
        code: "UPLOAD_FAILED",
        message: `Failed to delete image: ${error.message}`,
        originalError: error,
      } as StorageError;
    }

    throw {
      code: "UNKNOWN",
      message: "Failed to delete image",
      originalError: error instanceof Error ? error : undefined,
    } as StorageError;
  }
}

/**
 * Delete all images for a listing
 *
 * Useful when deleting a listing or clearing all images.
 * Continues deleting remaining images even if one fails.
 *
 * @param listingId - The listing ID containing the images
 * @param imageIds - Array of image IDs to delete
 * @returns Promise resolving to {successful, failed} counts
 *
 * Example:
 * ```typescript
 * const result = await deleteListingImages('listing-123', ['img-1', 'img-2']);
 * console.log(`Deleted ${result.successful} images, ${result.failed} failed`);
 * ```
 */
export async function deleteListingImages(
  listingId: string,
  imageIds: string[],
): Promise<{ successful: number; failed: number }> {
  if (!listingId) {
    throw new Error("listingId is required");
  }

  let successful = 0;
  let failed = 0;

  const storage = getFirebaseStorage();

  for (const imageId of imageIds) {
    try {
      const storageRef = ref(storage, `listings/${listingId}/${imageId}`);
      await deleteObject(storageRef);
      successful++;
    } catch (error) {
      console.error(`[Storage] Failed to delete image ${imageId}:`, error);
      failed++;
    }
  }

  return { successful, failed };
}
