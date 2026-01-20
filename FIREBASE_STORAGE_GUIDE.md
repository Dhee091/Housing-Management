# Firebase Storage Setup Guide

Complete guide to using Firebase Storage for listing images in the Estate Management app.

## Overview

The storage service provides a clean API for uploading, downloading, and deleting listing images with:

- **Client-side file validation** (type, size)
- **Automatic error handling** with cleanup on failure
- **Download URL generation** ready for database storage
- **TypeScript support** with full type safety
- **Metadata tracking** for auditing (uploader, timestamp, original filename)

## Architecture

```
Firebase Storage
    ↓
storageService.ts (Core functionality)
    ↓
fileValidation.ts (UI utilities & formatting)
    ↓
ImageUploadForm.tsx (Example component)
    ↓
Your App Components
```

## Quick Start

### 1. Upload Images to a Listing

```typescript
import { uploadListingImages } from "@/services/storage/storageService";
import type { AuthUser } from "@/services/auth/authService";

const handleUpload = async (
  files: File[],
  listingId: string,
  currentUser: AuthUser,
) => {
  try {
    const uploadedImages = await uploadListingImages(
      listingId,
      files,
      currentUser,
    );

    // uploadedImages is an array of UploadedImage objects:
    // [
    //   {
    //     id: "1234567890-abc123",
    //     url: "https://storage.googleapis.com/...",
    //     altText: "",
    //     order: 0
    //   },
    //   ...
    // ]

    // Save to your listing document
    setListing((prev) => ({
      ...prev,
      images: uploadedImages,
    }));
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

### 2. Validate Files Before Upload

```typescript
import { checkFiles } from "@/services/storage/fileValidation";

const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
  const result = checkFiles(event.target.files);

  if (!result.isValid) {
    // Show errors to user
    setErrors(result.errors);
    return;
  }

  // Files are valid, ready to upload
  const files = Array.from(event.target.files!);
  handleUpload(files, listingId, currentUser);
};
```

### 3. Delete Single Image

```typescript
import { deleteListingImage } from "@/services/storage/storageService";

const handleDeleteImage = async (listingId: string, imageId: string) => {
  try {
    await deleteListingImage(listingId, imageId);

    // Update UI - remove image from listing
    setListing((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));
  } catch (error) {
    console.error("Delete failed:", error);
  }
};
```

### 4. Delete All Images for Listing

```typescript
import { deleteListingImages } from "@/services/storage/storageService";

const handleDeleteAllImages = async (listingId: string, imageIds: string[]) => {
  const result = await deleteListingImages(listingId, imageIds);
  console.log(`Deleted ${result.successful} images, ${result.failed} failed`);
};
```

## Validation Configuration

### Default Configuration

```typescript
export const DEFAULT_LISTING_IMAGE_CONFIG = {
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxSize: 5 * 1024 * 1024, // 5MB
  typeError: "Only JPEG, PNG, and WebP images are allowed",
  sizeError: "Image size must be less than 5MB",
};

export const MAX_IMAGES_PER_LISTING = 20;
```

### Custom Configuration

```typescript
import {
  uploadListingImages,
  type FileValidationConfig,
} from "@/services/storage/storageService";

const customConfig: FileValidationConfig = {
  allowedTypes: ["image/jpeg", "image/png"],
  maxSize: 3 * 1024 * 1024, // 3MB
  typeError: "Only JPEG and PNG allowed",
  sizeError: "Max 3MB per image",
};

await uploadListingImages(
  listingId,
  files,
  currentUser,
  customConfig, // Pass custom config
);
```

## API Reference

### `uploadListingImages(listingId, files, currentUser, config?)`

**Uploads multiple images to Firebase Storage**

- **Parameters:**
  - `listingId` (string): Listing identifier
  - `files` (File[]): Array of File objects
  - `currentUser` (AuthUser): Authenticated user
  - `config?` (FileValidationConfig): Optional validation config

- **Returns:** `Promise<UploadedImage[]>`

- **Throws:** `StorageError` if validation fails or upload fails

- **Storage Path:** `/listings/{listingId}/{imageId}`

- **Metadata Stored:**
  - `uploadedBy`: Current user ID
  - `uploadedAt`: ISO 8601 timestamp
  - `originalFileName`: Original file name
  - `listingId`: Associated listing ID

### `deleteListingImage(listingId, imageId)`

**Deletes a single image from storage**

- **Parameters:**
  - `listingId` (string): Listing identifier
  - `imageId` (string): Image identifier

- **Returns:** `Promise<void>`

- **Throws:** `StorageError` if deletion fails

### `deleteListingImages(listingId, imageIds)`

**Deletes multiple images, continues if any fail**

- **Parameters:**
  - `listingId` (string): Listing identifier
  - `imageIds` (string[]): Array of image identifiers

- **Returns:** `Promise<{ successful: number; failed: number }>`

### `validateFile(file, config)`

**Validates a single file against configuration**

- **Returns:** `StorageError | null`

```typescript
const error = validateFile(file, DEFAULT_LISTING_IMAGE_CONFIG);
if (error) {
  console.error(error.message); // "Image size must be less than 5MB"
}
```

### `validateFiles(files, config?)`

**Validates multiple files**

- **Returns:** `StorageError[]` (empty if all valid)

```typescript
const errors = validateFiles(selectedFiles);
if (errors.length > 0) {
  errors.forEach((err) => console.error(err.message));
}
```

### `checkFiles(files, config?)`

**Validates files and returns detailed result for UI display**

- **Returns:** `FileCheckResult`
  - `isValid` (boolean): All files valid
  - `validCount` (number): Number of valid files
  - `errors` (string[]): Error messages
  - `totalSize` (number): Total size of valid files

```typescript
const result = checkFiles(event.target.files);
setValidCount(result.validCount);
setErrorMessages(result.errors);
```

## File Validation Utilities

### Formatting Functions

```typescript
import {
  formatFileSize,
  getFileExtension,
  getFileNameWithoutExtension,
  getSupportedFormats,
  getMaxFileSizeText,
  getImageUploadHelpText,
} from "@/services/storage/fileValidation";

// Format bytes to human-readable
formatFileSize(5242880); // "5 MB"

// Get file properties
getFileExtension(file); // "jpeg"
getFileNameWithoutExtension(file); // "my-photo"

// Get validation info for display
getSupportedFormats(); // "JPEG, PNG, WebP"
getMaxFileSizeText(); // "5 MB"

// Get complete help text
getImageUploadHelpText();
// "Supported formats: JPEG, PNG, WebP. Max size: 5 MB. Up to 20 images."
```

### MIME Type Utilities

```typescript
import { getMimeTypeName } from "@/services/storage/fileValidation";

getMimeTypeName("image/jpeg"); // "JPEG"
getMimeTypeName("image/png"); // "PNG"
getMimeTypeName("image/webp"); // "WebP"
```

### Error Formatting

```typescript
import { formatErrorMessages } from "@/services/storage/fileValidation";

const formatted = formatErrorMessages(errors);
// Returns formatted string with bullets, or null if empty
```

## Example Component

Complete example component with all features:

**[See ImageUploadForm.tsx](../components/ImageUploadForm.tsx)**

Features:

- Drag-and-drop support
- File input selection
- Real-time validation
- Upload progress tracking
- Error handling and recovery
- File preview
- Accessibility support

## Storage Rules

The Firebase Storage rules are configured in `firestore.rules`. Key rules:

```
match /listings/{listingId}/{allPaths=**} {
  allow read: if true; // Public read
  allow create: if request.auth != null; // Authenticated only
  allow update: if request.auth.uid == resource.metadata.uploadedBy;
  allow delete: if request.auth.uid == resource.metadata.uploadedBy;
}
```

## Security Considerations

1. **Client-side validation is for UX only** - Always validate on server
2. **Storage rules enforce owner access** - Server-side security
3. **Download URLs are temporary** - Expire in ~2 weeks (Firebase default)
4. **File paths are predictable** - Include user ID in logic
5. **Metadata stored for auditing** - Track who uploaded and when

## Firestore Integration

Store image references in your listing document:

```typescript
// Your ApartmentListing model
export interface ApartmentListing {
  id: string;
  title: string;
  // ... other fields
  images: ListingImage[]; // Array of image references
}

// ListingImage structure
export interface ListingImage {
  id: string; // From Firebase Storage upload
  url: string; // Download URL
  altText: string; // Accessibility
  order: number; // Display order
  thumbnailUrl?: string; // Optional thumbnail
}
```

When listing is deleted, remember to clean up storage:

```typescript
const deleteListing = async (listing: ApartmentListing) => {
  // Delete images from storage first
  await deleteListingImages(
    listing.id,
    listing.images.map((img) => img.id),
  );

  // Then delete listing from Firestore
  await listingService.deleteListing(listing.id);
};
```

## Common Patterns

### Upload with Progress Tracking

```typescript
const [uploadProgress, setUploadProgress] = useState(0);

const handleUpload = async () => {
  // Firebase SDK doesn't provide granular progress,
  // but you can simulate it:
  const progressInterval = setInterval(() => {
    setUploadProgress(prev => {
      if (prev >= 90) return prev;
      return prev + Math.random() * 30;
    });
  }, 500);

  try {
    const images = await uploadListingImages(...);
    setUploadProgress(100);
  } finally {
    clearInterval(progressInterval);
  }
};
```

### Batch Upload Multiple Images

```typescript
const handleBatchUpload = async (listingId: string, fileArrays: File[][]) => {
  const allImages: UploadedImage[] = [];

  for (const files of fileArrays) {
    const images = await uploadListingImages(listingId, files, currentUser);
    allImages.push(...images);
  }

  return allImages;
};
```

### Handle Upload Failure Gracefully

```typescript
const handleUpload = async (files: File[]) => {
  try {
    const images = await uploadListingImages(...);
    return images;
  } catch (error) {
    if (error instanceof Error) {
      // User-friendly error messages
      const message = error.message.includes('validation')
        ? 'Please check file types and sizes'
        : 'Upload failed. Please try again.';

      setErrorMessage(message);
      return null;
    }
  }
};
```

## Troubleshooting

### Upload fails with "Not authenticated"

- Ensure user is logged in before uploading
- Check Firebase Auth is initialized
- Verify `currentUser` has valid `uid`

### Files rejected by validation

- Check `allowedTypes` matches file MIME types
- Check `maxSize` is sufficient
- Consider custom config for different requirements

### Download URLs not working

- Ensure image was fully uploaded
- Check Storage rules allow read access
- Note: URLs expire after ~2 weeks

### Cleanup on error fails

- Check Storage rules allow delete access
- Review console logs for specific errors
- May need to manually delete orphaned files

### Storage quota exceeded

- Upload files are accumulating
- Implement storage cleanup for deleted listings
- Monitor Firebase Storage usage in console

## Best Practices

1. **Always validate before upload** - Catch errors early
2. **Cleanup on deletion** - Don't leave orphaned files
3. **Set meaningful alt text** - Accessibility and SEO
4. **Use image order** - Control gallery display
5. **Monitor storage usage** - Track and optimize
6. **Test with Firebase Emulator** - Develop offline
7. **Use JPGE for photos** - Better compression
8. **Use PNG for graphics** - Better for UI elements
9. **Optimize image size** - Consider compression before upload
10. **Cache download URLs** - Don't regenerate frequently

## Deployment Checklist

- [ ] Update `.env` with Firebase Storage bucket
- [ ] Deploy Firestore rules (includes Storage config)
- [ ] Test upload with real files
- [ ] Verify download URLs work
- [ ] Check Storage rules in console
- [ ] Set up Storage backup policy
- [ ] Monitor Storage quota
- [ ] Document storage cleanup process
- [ ] Test deletion and error scenarios
- [ ] Review security rules with team

## Environment Variables

Required in `.env`:

```
VITE_REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

This is automatically included in your Firebase config from the console.

## Related Documentation

- [Firebase Config Setup](./src/config/firebase.ts)
- [Firestore Rules](./firestore.rules) - Includes Storage rules
- [Domain Models](./src/models/domain.ts) - ListingImage structure
- [Authentication Setup](./AUTHENTICATION_SETUP.md)

## Support

For issues:

1. Check browser console for detailed error messages
2. Review Firebase Logs in Console
3. Test with Firebase Emulator for local debugging
4. Verify Firestore/Storage rules are deployed
5. Check network tab for failed requests
