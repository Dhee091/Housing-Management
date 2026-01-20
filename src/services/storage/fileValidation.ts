/**
 * File Validation Utilities
 *
 * Reusable validation functions for client-side file handling.
 * Provides user-friendly error messages and helper functions for forms.
 */

import {
  DEFAULT_LISTING_IMAGE_CONFIG,
  MAX_IMAGES_PER_LISTING,
  validateFile,
  type FileValidationConfig,
} from "./storageService";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Result of checking file input validity for display in UI
 */
export interface FileCheckResult {
  /** Whether all files are valid */
  isValid: boolean;

  /** Count of valid files */
  validCount: number;

  /** Human-readable error messages */
  errors: string[];

  /** Total size of valid files in bytes */
  totalSize: number;
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format bytes to human-readable file size
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "2.5 MB")
 *
 * @example
 * ```typescript
 * formatFileSize(5242880) // "5 MB"
 * formatFileSize(1536) // "1.5 KB"
 * ```
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, index);

  return `${size.toFixed(1)} ${units[index]}`;
}

/**
 * Get file extension from File object
 *
 * @param file - File object
 * @returns Extension (e.g., "jpg", "png") or empty string
 *
 * @example
 * ```typescript
 * getFileExtension(file) // "jpeg"
 * ```
 */
export function getFileExtension(file: File): string {
  const nameParts = file.name.split(".");
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
}

/**
 * Get file name without extension
 *
 * @param file - File object
 * @returns Name without extension
 *
 * @example
 * ```typescript
 * getFileNameWithoutExtension(file) // "my-photo"
 * ```
 */
export function getFileNameWithoutExtension(file: File): string {
  const lastDotIndex = file.name.lastIndexOf(".");
  return lastDotIndex === -1 ? file.name : file.name.substring(0, lastDotIndex);
}

// ============================================================================
// FILE CHECKING
// ============================================================================

/**
 * Check if files are valid for listing image upload
 *
 * Validates all files and returns a detailed result with error messages.
 * Useful for display in image upload form before attempting upload.
 *
 * @param files - FileList from input element or File array from drag-drop
 * @param config - Optional validation config (uses defaults if not provided)
 * @returns FileCheckResult with validity status and errors
 *
 * @example
 * ```typescript
 * const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
 *   const result = checkFiles(event.target.files);
 *   if (!result.isValid) {
 *     setErrors(result.errors);
 *   } else {
 *     setFiles(Array.from(event.target.files!));
 *   }
 * };
 * ```
 */
export function checkFiles(
  files: FileList | File[] | null,
  config: FileValidationConfig = DEFAULT_LISTING_IMAGE_CONFIG,
): FileCheckResult {
  const result: FileCheckResult = {
    isValid: true,
    validCount: 0,
    errors: [],
    totalSize: 0,
  };

  // Check for empty input
  if (!files || files.length === 0) {
    result.isValid = true;
    result.validCount = 0;
    return result;
  }

  const fileArray = Array.isArray(files) ? files : Array.from(files);

  // Check count limit
  if (fileArray.length > MAX_IMAGES_PER_LISTING) {
    result.isValid = false;
    result.errors.push(
      `Too many images. Maximum ${MAX_IMAGES_PER_LISTING} images allowed per listing.`,
    );
  }

  // Check each file
  let validCount = 0;
  let totalSize = 0;

  for (const file of fileArray) {
    const error = validateFile(file, config);

    if (error) {
      result.isValid = false;
      // Only show unique error messages to avoid clutter
      if (!result.errors.includes(error.message)) {
        result.errors.push(error.message);
      }
    } else {
      validCount++;
      totalSize += file.size;
    }
  }

  result.validCount = validCount;
  result.totalSize = totalSize;

  return result;
}

/**
 * Check if a single file is valid
 *
 * @param file - File to check
 * @param config - Optional validation config
 * @returns Error message if invalid, null if valid
 *
 * @example
 * ```typescript
 * const error = checkFile(file);
 * if (error) {
 *   console.error(error);
 * }
 * ```
 */
export function checkFile(
  file: File,
  config: FileValidationConfig = DEFAULT_LISTING_IMAGE_CONFIG,
): string | null {
  const error = validateFile(file, config);
  return error ? error.message : null;
}

// ============================================================================
// MIME TYPE UTILITIES
// ============================================================================

/**
 * Get human-readable name for MIME type
 *
 * @param mimeType - MIME type string
 * @returns Display name (e.g., "JPEG", "PNG")
 *
 * @example
 * ```typescript
 * getMimeTypeName("image/jpeg") // "JPEG"
 * getMimeTypeName("image/png") // "PNG"
 * ```
 */
export function getMimeTypeName(mimeType: string): string {
  const mimeNames: Record<string, string> = {
    "image/jpeg": "JPEG",
    "image/png": "PNG",
    "image/webp": "WebP",
  };

  return mimeNames[mimeType] || mimeType;
}

/**
 * Get supported image formats as user-friendly string
 *
 * @param config - Optional validation config
 * @returns Comma-separated format names
 *
 * @example
 * ```typescript
 * getSupportedFormats() // "JPEG, PNG, WebP"
 * ```
 */
export function getSupportedFormats(
  config: FileValidationConfig = DEFAULT_LISTING_IMAGE_CONFIG,
): string {
  return config.allowedTypes.map(getMimeTypeName).join(", ");
}

/**
 * Get max file size as formatted string
 *
 * @param config - Optional validation config
 * @returns Formatted size string
 *
 * @example
 * ```typescript
 * getMaxFileSizeText() // "5 MB"
 * ```
 */
export function getMaxFileSizeText(
  config: FileValidationConfig = DEFAULT_LISTING_IMAGE_CONFIG,
): string {
  return formatFileSize(config.maxSize);
}

// ============================================================================
// UI HELPER MESSAGES
// ============================================================================

/**
 * Generate help text for image upload input
 *
 * @param config - Optional validation config
 * @returns Help text suitable for display below input
 *
 * @example
 * ```typescript
 * <small>{getImageUploadHelpText()}</small>
 * // Output: "Supported formats: JPEG, PNG, WebP. Max size: 5 MB. Up to 20 images."
 * ```
 */
export function getImageUploadHelpText(
  config: FileValidationConfig = DEFAULT_LISTING_IMAGE_CONFIG,
): string {
  return (
    `Supported formats: ${getSupportedFormats(config)}. ` +
    `Max size: ${getMaxFileSizeText(config)}. ` +
    `Up to ${MAX_IMAGES_PER_LISTING} images.`
  );
}

/**
 * Format error messages from validation for display
 *
 * Takes validation errors and formats them for user-friendly display.
 *
 * @param errors - Array of error messages
 * @returns Formatted HTML-ready string or null if no errors
 *
 * @example
 * ```typescript
 * const formatted = formatErrorMessages(errors);
 * if (formatted) {
 *   <div className="error">{formatted}</div>
 * }
 * ```
 */
export function formatErrorMessages(errors: string[]): string | null {
  if (!errors || errors.length === 0) return null;

  if (errors.length === 1) {
    return errors[0];
  }

  return errors.map((err) => `• ${err}`).join("\n");
}

/**
 * Get appropriate error color/severity based on error code
 *
 * @param errorCode - Error code from StorageError
 * @returns CSS class name or color value for display
 *
 * @example
 * ```typescript
 * <div className={getErrorSeverity(error.code)}>
 *   {error.message}
 * </div>
 * ```
 */
export function getErrorSeverity(
  errorCode:
    | "INVALID_FILE_TYPE"
    | "FILE_TOO_LARGE"
    | "UPLOAD_FAILED"
    | "UNKNOWN",
): string {
  const severityMap: Record<string, string> = {
    INVALID_FILE_TYPE: "error-warning", // User can fix
    FILE_TOO_LARGE: "error-warning", // User can fix
    UPLOAD_FAILED: "error-danger", // Might be temporary or system issue
    UNKNOWN: "error-danger", // Unexpected
  };

  return severityMap[errorCode] || "error-danger";
}
