<!-- Firebase Storage Rules Quick Reference -->

# Firebase Storage Rules - Quick Reference

Quick lookup for Storage security rules.

## Rules at a Glance

```javascript
// Path: /listings/{listingId}/{imageId}
allow read: if true;              // Public download

allow create: if isAuthenticated() && 
  (isListingOwner(listingId) || isAdmin());  // Own listing only

allow update: if isAuthenticated() && 
  (isListingOwner(listingId) || isAdmin());  // Owner/admin only

allow delete: if isAuthenticated() && 
  (isListingOwner(listingId) || isAdmin());  // Owner/admin only

// Catch-all: Deny everything else
match /{allPaths=**} {
  allow read, write: if false;
}
```

## Access Matrix (Quick Lookup)

| Operation | Anonymous | Owner | Non-Owner | Admin |
|-----------|-----------|-------|-----------|-------|
| **Download** | ✅ | ✅ | ✅ | ✅ |
| **Upload** | ❌ | ✅ | ❌ | ✅ |
| **Update** | ❌ | ✅ | ❌ | ✅ |
| **Delete** | ❌ | ✅ | ❌ | ✅ |

## Helper Functions

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isListingOwner(listingId) {
  return get(/databases/(default)/documents/listings/$(listingId))
    .data.listedBy.id == request.auth.uid;
}

function isAdmin() {
  return get(/databases/(default)/documents/users/$(request.auth.uid))
    .data.role == 'admin';
}
```

## Error Messages

| Scenario | Error Code | Message |
|----------|-----------|---------|
| Anonymous upload | 403 | Permission denied (not authenticated) |
| Non-owner upload | 403 | Permission denied (not listing owner) |
| Invalid path | 403 | Permission denied (not in /listings/{id}/) |
| File too large | 400 | Storage quota exceeded (or client validation) |
| Upload success | — | 200 OK with download URL |

## Deployment Checklist

- [ ] Copy Storage rules from firestore.rules
- [ ] Go to Firebase Console > Storage > Rules
- [ ] Paste rules and publish
- [ ] Verify "Active" status
- [ ] Test with owner account (should upload)
- [ ] Test with non-owner account (should fail)
- [ ] Test anonymous download (should work)

## Common Issues

| Problem | Fix |
|---------|-----|
| Upload fails with "Permission denied" | Verify user owns listing in Firestore |
| Download fails | Check rule has `allow read: if true` |
| Non-owner can upload | Check isListingOwner() is in create rule |
| Admin can't upload | Check role field = 'admin' exactly |

## Key Concepts

**Path-based control:** `/listings/{listingId}/` extracted from upload path

**Ownership check:** User UID must match `listing.listedBy.id`

**Admin bypass:** `isAdmin()` check allows support staff

**Default deny:** `/{allPaths=**}` explicitly denies unknown paths

## Testing

```javascript
// Owner upload (should work)
await uploadBytes(ref(storage, 'listings/own-listing-id/image.jpg'), file);
// ✅ Success

// Non-owner upload (should fail)
await uploadBytes(ref(storage, 'listings/other-listing-id/image.jpg'), file);
// ❌ Permission denied (403)

// Public download (always works)
const url = await getDownloadURL(ref(storage, 'listings/any-id/image.jpg'));
// ✅ Success
```

## Integration with Backend

```typescript
// storageService.ts enforces client-side validation:
// 1. File type (JPEG, PNG, WebP)
// 2. File size (max 5MB)
// 3. File count (max 20)

// Storage rules enforce server-side:
// 1. Authentication required
// 2. Ownership verified
// 3. Admin bypass available
```

## Variables Available in Rules

```javascript
request.auth.uid          // Current user's UID
request.auth              // Full auth token
request.resource.data     // File metadata
request.resource.size     // File size in bytes
request.resource.contentType  // MIME type
request.time              // Current time

resource.data             // Existing file metadata
resource.size             // Existing file size
```

## Firestore Lookup Costs

Each create/update triggers one Firestore read:
- Lookup: 1 read
- Check isAdmin(): 1 read
- **Total per upload:** 2-3 reads

Cost: $0.06 per 100K reads

## File Location in Repository

```
firestore.rules
├─ Lines 1-195: Firestore rules
├─ Lines 196-227: Firebase Storage rules
│  ├─ Helper functions
│  ├─ /listings/{listingId}/{imageId} rules
│  └─ /{allPaths=**} catch-all
└─ Lines 228-362: Deployment instructions
```

## Key Security Features

✅ **Authenticated uploads only**
✅ **Path validation** (/listings/{id}/ only)
✅ **Ownership enforcement** (listedBy.id check)
✅ **Admin bypass** for support
✅ **Public reads** for images
✅ **Default deny** for safety
✅ **Metadata tracking** in backend

## Related Files

- `firestore.rules` - Rules file
- `FIREBASE_STORAGE_RULES.md` - Complete documentation
- `FIREBASE_STORAGE_RULES_DEPLOYMENT.md` - Deployment guide
- `storageService.ts` - Backend upload service

## Quick Deploy

```bash
# 1. Copy /listings section from firestore.rules
# 2. Go to Firebase Console > Storage > Rules
# 3. Paste and click Publish
# Done!
```

## Rule Decision Tree

```
User tries to upload to /listings/{listingId}/image.jpg

1. Is user logged in?
   No → DENY (403)
   Yes ↓

2. Is user the listing owner?
   Yes → ALLOW ✅
   No ↓

3. Is user an admin?
   Yes → ALLOW ✅
   No → DENY (403) ❌
```

## Common Patterns

### Allow owner only
```javascript
allow create: if request.auth.uid == listing.listedBy.id;
```

### Allow owner or admin
```javascript
allow create: if isListingOwner(listingId) || isAdmin();
```

### Public read
```javascript
allow read: if true;
```

### Deny everything
```javascript
allow read, write: if false;
```

## Best Practices

1. **Always include authentication check** before allowing write
2. **Use specific paths** - don't use catch-all for allows
3. **Implement deny catch-all** - `/{allPaths=**} { allow if false; }`
4. **Lookup Firestore for ownership** - real-time verification
5. **Allow public reads** - encourage user engagement
6. **Test non-owner access** - verify rules work as expected

## Limits

- Max file size: Browser/Firebase limits (typically 5GB)
- Max files per listing: Unlimited (enforced by app)
- Download bandwidth: Based on Firebase plan
- Storage quota: Based on Firebase plan
- Read operations: $0.06 per 100K (for ownership checks)

---

**Status:** ✅ Production Ready | **Last Updated:** January 2026
