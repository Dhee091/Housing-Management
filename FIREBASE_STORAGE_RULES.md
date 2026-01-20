<!-- Firebase Storage Security Rules Documentation -->

# Firebase Storage Security Rules

Complete documentation for the Storage security rules implementing access control for listing images.

## Overview

Firebase Storage rules control who can upload, download, and delete listing images. These rules enforce:

- **Public read access** - Anyone can view listing images
- **Authenticated uploads** - Only logged-in users can upload
- **Ownership enforcement** - Users can only upload to their own listings
- **Admin bypass** - Admins can manage any listing's images
- **Path validation** - Prevents uploading to unauthorized folders

## Rule Structure

```
service firebase.storage {
  match /listings/{listingId}/{imageId} {
    allow read: if true;                          // Public
    allow create: if isListingOwner() || isAdmin(); // Owner/admin
    allow update: if isListingOwner() || isAdmin(); // Owner/admin
    allow delete: if isListingOwner() || isAdmin(); // Owner/admin
  }
  match /{allPaths=**} {
    allow read, write: if false;                  // Deny everything else
  }
}
```

## Rules Explained

### Read Access (Public)

```javascript
allow read: if true;
```

**Who can download:**

- ✅ Anonymous users (no login required)
- ✅ Authenticated users
- ✅ Anyone with the URL

**Use case:** Users viewing listing photos don't need to be logged in

**Example:**

```javascript
// Anyone can download this image
const url = "https://storage.googleapis.com/.../listings/apt-123/img-001";
const response = await fetch(url);
```

### Create Access (Authenticated + Owner/Admin)

```javascript
allow create: if isAuthenticated() &&
  (isListingOwner(listingId) || isAdmin());
```

**Who can upload:**

- ✅ Listing owner uploading to their listing
- ✅ Admin users uploading to any listing
- ❌ Non-owner authenticated users
- ❌ Anonymous users

**Validation:**

1. User must be logged in (`isAuthenticated()`)
2. User must own the listing being uploaded to (`isListingOwner(listingId)`)
   - OR user must be an admin (`isAdmin()`)
3. Path must match `/listings/{listingId}/filename`

**Example - Allowed:**

```typescript
// User owns listing apt-123, can upload
uploadBytes(ref(storage, "listings/apt-123/living-room.jpg"), file);
```

**Example - Denied (FORBIDDEN 403):**

```typescript
// User does NOT own listing apt-456, upload fails
uploadBytes(ref(storage, "listings/apt-456/image.jpg"), file); // ❌ FORBIDDEN
```

### Update Access (Owner/Admin Only)

```javascript
allow update: if isAuthenticated() &&
  (isListingOwner(listingId) || isAdmin());
```

**Who can update:**

- ✅ Listing owner (can modify file metadata)
- ✅ Admin users (can modify any file)
- ❌ Non-owner users
- ❌ Anonymous users

**Use case:** Update file metadata or replace image content

### Delete Access (Owner/Admin Only)

```javascript
allow delete: if isAuthenticated() &&
  (isListingOwner(listingId) || isAdmin());
```

**Who can delete:**

- ✅ Listing owner (can delete their images)
- ✅ Admin users (can delete any images)
- ❌ Non-owner users
- ❌ Anonymous users

**Example:**

```typescript
// User owns apt-123, can delete
await deleteObject(ref(storage, "listings/apt-123/old-photo.jpg")); // ✅

// User doesn't own apt-456, delete fails
await deleteObject(ref(storage, "listings/apt-456/photo.jpg")); // ❌ FORBIDDEN
```

## Helper Functions

### isAuthenticated()

```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

Checks if the user is logged in.

- **Returns:** `true` if user is authenticated, `false` otherwise
- **Usage:** Required for all write operations

### isListingOwner(listingId)

```javascript
function isListingOwner(listingId) {
  return get(/databases/(default)/documents/listings/$(listingId))
    .data.listedBy.id == request.auth.uid;
}
```

Checks if the current user owns the listing by comparing their UID with `listing.listedBy.id`.

- **Parameters:**
  - `listingId` - Extracted from upload path
- **Returns:** `true` if user owns the listing, `false` otherwise
- **Note:** This lookup reads from Firestore (real-time verification)

**How it works:**

1. Extract `listingId` from path `/listings/{listingId}/file`
2. Look up listing document from Firestore
3. Compare `request.auth.uid` with `listing.listedBy.id`
4. If match, user is owner

### isAdmin()

```javascript
function isAdmin() {
  return get(/databases/(default)/documents/users/$(request.auth.uid))
    .data.role == 'admin';
}
```

Checks if the current user has admin role.

- **Returns:** `true` if user role is 'admin', `false` otherwise
- **Note:** Reads user document from Firestore
- **Future:** Can be upgraded to use Firebase custom claims for performance

**User document:**

```json
{
  "uid": "user-123",
  "email": "admin@example.com",
  "role": "admin" // This field is checked
}
```

## Security Patterns

### Path-Based Access Control

The `/listings/{listingId}/` path is part of the security check:

```typescript
// Valid path structure
/listings/{listingId}/{imageId}
          ↑              ↑
          |              └─ Unique image ID
          └─ Must own this listing
```

**Example - Path Validation:**

```typescript
// User owns apartment "apt-123"
// ✅ CAN upload: /listings/apt-123/image.jpg
// ❌ CANNOT upload: /listings/apt-456/image.jpg
```

### Firestore Lookup for Ownership

Each upload triggers a Firestore read:

```
User uploads to /listings/apt-123/image.jpg
        ↓
Rule checks isListingOwner("apt-123")
        ↓
Firestore reads /listings/apt-123
        ↓
Compares user.uid with listing.listedBy.id
        ↓
Allow or deny
```

**Performance note:** Each write operation reads Firestore, which counts against quota.

## Default Deny Pattern

```javascript
match /{allPaths=**} {
  allow read, write: if false;
}
```

This explicitly denies access to any paths not covered by previous rules.

**Security benefit:**

- Prevents users from uploading to `/other-folder/file`
- Prevents accessing files in unexpected locations
- Fail-safe: unknown paths are always denied

## Common Scenarios

### Scenario 1: User Uploads to Own Listing

```
User: john (uid: user-123)
Listing: apt-001 (listedBy.id: user-123)
Action: Upload image to /listings/apt-001/

Steps:
1. Check isAuthenticated() → YES
2. Check isListingOwner("apt-001")
   - Get /listings/apt-001
   - Check user-123 == listedBy.id (user-123)
   - Result: YES
3. Allow create ✅
```

### Scenario 2: User Tries to Upload to Other's Listing

```
User: alice (uid: user-456)
Listing: apt-001 (listedBy.id: user-123)
Action: Upload image to /listings/apt-001/

Steps:
1. Check isAuthenticated() → YES
2. Check isListingOwner("apt-001")
   - Get /listings/apt-001
   - Check user-456 == listedBy.id (user-123)
   - Result: NO
3. Check isAdmin()
   - Get /users/user-456
   - Check role == 'admin'
   - Result: NO
4. Allow create ❌ DENIED (403 Forbidden)
```

### Scenario 3: Admin Uploads to Any Listing

```
User: admin-user (uid: user-789)
Listing: apt-001 (listedBy.id: user-123)
Action: Upload image to /listings/apt-001/

Steps:
1. Check isAuthenticated() → YES
2. Check isListingOwner("apt-001")
   - Get /listings/apt-001
   - Check user-789 == listedBy.id (user-123)
   - Result: NO
3. Check isAdmin()
   - Get /users/user-789
   - Check role == 'admin'
   - Result: YES
4. Allow create ✅
```

### Scenario 4: Anonymous User Downloads Image

```
User: anonymous (no login)
Action: Download /listings/apt-001/image.jpg

Steps:
1. Check allow read: if true
2. Result: YES ✅
   (No authentication required)
```

## Integration with Backend

The Storage rules work together with the backend service layer:

### 1. Frontend Upload

```typescript
// src/services/storage/storageService.ts
async function uploadListingImages(listingId, files, currentUser) {
  // 1. Client-side validation
  validateFiles(files); // Check MIME type, size

  // 2. Upload to Storage
  const ref = ref(storage, `listings/${listingId}/${imageId}`);
  await uploadBytes(ref, file, {
    customMetadata: {
      uploadedBy: currentUser.uid,
      uploadedAt: new Date().toISOString(),
      listingId,
    },
  });

  // If rule denies: Firebase throws Permission denied error
  // Rule check: isListingOwner(listingId)
}
```

### 2. Rule Verification

```javascript
// firestore.rules - Storage rules
match /listings/{listingId}/{imageId} {
  allow create: if isAuthenticated() &&
    (isListingOwner(listingId) || isAdmin());
}

// Check: Does user own /listings/{listingId}?
function isListingOwner(listingId) {
  return get(/databases/(default)/documents/listings/$(listingId))
    .data.listedBy.id == request.auth.uid;
}
```

### 3. Error Handling

```typescript
try {
  await uploadBytes(ref, file);
} catch (error) {
  if (error.code === "storage/unauthorized") {
    // User doesn't own listing
    console.error("You can only upload to your own listings");
  }
}
```

## Deployment

### To Firebase Console

1. **Go to Storage Rules:**
   - Firebase Console → Select Project
   - Storage → Rules tab

2. **Copy Rules:**
   - Copy `service firebase.storage { ... }` block from `firestore.rules`

3. **Paste and Publish:**
   - Replace existing rules
   - Click "Publish"

4. **Verify Deployment:**
   - Rules should show green "Active" status

### Rules File Location

```
firestore.rules
├─ rules_version = '2';
├─ service cloud.firestore { ... }  ← Firestore rules
└─ service firebase.storage { ... }  ← Storage rules
```

## Testing

### With Firebase Emulator

```bash
# Start emulator
firebase emulators:start

# Set env variable
VITE_REACT_APP_USE_FIREBASE_EMULATOR=true
```

### Test Cases

1. **Anonymous download (should pass):**

   ```typescript
   const url = storage.ref("listings/apt-123/image.jpg");
   // ✅ Can download without auth
   ```

2. **Owner upload (should pass):**

   ```typescript
   const ref = ref(storage, "listings/apt-123/image.jpg");
   // User owns apt-123
   // ✅ Can upload
   ```

3. **Non-owner upload (should fail):**

   ```typescript
   const ref = ref(storage, "listings/apt-456/image.jpg");
   // User doesn't own apt-456
   // ❌ Permission denied
   ```

4. **Admin upload to any listing (should pass):**
   ```typescript
   // User is admin
   const ref = ref(storage, "listings/any-id/image.jpg");
   // ✅ Can upload to any listing
   ```

## Performance Considerations

### Read Operations

- **Download images:** Very fast (only checks path exists)
- **No Firestore lookup** needed for reads
- **No quota impact** beyond storage bandwidth

### Write Operations

- **Each upload:** Triggers Firestore read for ownership check
- **Impact:** +1 Firestore read per upload
- **Cost:** $0.06 per 100K reads (Firebase pricing)
- **Alternative:** Use Firebase custom claims to avoid Firestore lookup

## Future Improvements

### 1. Firebase Custom Claims (Performance)

Instead of reading Firestore for admin check:

```javascript
// Current: Reads Firestore every time
function isAdmin() {
  return get(/databases/(default)/documents/users/$(request.auth.uid))
    .data.role == 'admin';
}

// Better: Use custom claims (no Firestore read)
function isAdmin() {
  return request.auth.token.admin == true;
}
```

**Setup:**

- Cloud Function sets admin claim during role change
- Claims cached in ID token
- No Firestore lookup needed

### 2. Request Size Validation

Add validation for file size in rules:

```javascript
allow create: if isAuthenticated() &&
  (isListingOwner(listingId) || isAdmin()) &&
  request.resource.size < 5242880;  // 5 MB
```

### 3. MIME Type Validation

Validate file type in rules:

```javascript
allow create: if isAuthenticated() &&
  (isListingOwner(listingId) || isAdmin()) &&
  request.resource.contentType.matches('image/.*');
```

## Troubleshooting

### Upload Returns "Permission Denied"

**Cause:** User doesn't own the listing

**Solution:**

- Check `listing.listedBy.id` matches current user's UID
- Verify user is logged in
- Check listing exists

**Code to debug:**

```typescript
// Check user's UID
console.log("User UID:", currentUser.uid);

// Check listing ownership
const listing = await getDoc(doc(db, "listings", listingId));
console.log("Owner UID:", listing.data().listedBy.id);

// Compare
if (listing.data().listedBy.id === currentUser.uid) {
  console.log("User owns listing ✅");
} else {
  console.log("User does NOT own listing ❌");
}
```

### Download Returns "Not Found"

**Cause:** Image doesn't exist or path is wrong

**Solution:**

- Verify listingId and imageId are correct
- Check image was successfully uploaded
- Verify Storage rules allow read (they do)

### Admin Can't Upload

**Cause:** User's role field is not 'admin'

**Solution:**

- Check user document in Firestore
- Verify `/users/{uid}/role` is exactly 'admin' (lowercase)
- Restart app to refresh auth token

## Security Summary

| Access Type   | Anonymous | Owner | Non-Owner | Admin |
| ------------- | --------- | ----- | --------- | ----- |
| Read/Download | ✅        | ✅    | ✅        | ✅    |
| Upload        | ❌        | ✅    | ❌        | ✅    |
| Update        | ❌        | ✅    | ❌        | ✅    |
| Delete        | ❌        | ✅    | ❌        | ✅    |

## Related Documentation

- [FIREBASE_STORAGE_GUIDE.md](FIREBASE_STORAGE_GUIDE.md) - Storage service integration
- [FIREBASE_STORAGE_QUICK_REFERENCE.md](FIREBASE_STORAGE_QUICK_REFERENCE.md) - Quick reference
- [storageService.ts](src/services/storage/storageService.ts) - Upload implementation
- [firestore.rules](firestore.rules) - Complete rules file
