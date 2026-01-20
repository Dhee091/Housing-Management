# Firebase Implementation Details

Complete technical reference for the FirebaseListingService implementation.

---

## Architecture Overview

### IListingService Interface (Same for both Mock and Firebase)

```typescript
interface IListingService {
  getListings(
    filters?: ListingFilters
  ): Promise<PaginatedResult<ApartmentListing>>;
  getListingById(id: string): Promise<ApartmentListing>;
  createListing(data: CreateListingInput): Promise<ApartmentListing>;
  updateListing(
    id: string,
    data: UpdateListingInput
  ): Promise<ApartmentListing>;
  deleteListing(id: string): Promise<void>;
  search(
    query: string,
    filters?: Omit<ListingFilters, "searchTerm">
  ): Promise<PaginatedResult<ApartmentListing>>;
  getListingsByUser(
    userId: string,
    filters?: ListingFilters
  ): Promise<PaginatedResult<ApartmentListing>>;
}
```

Both `MockListingService` and `FirebaseListingService` implement this interface identically.

---

## Implementation Method-by-Method

### 1. createListing

**Purpose:** Create a new apartment listing with images

**Flow:**

```
Input: CreateListingInput
  ├─ Generate unique listing ID
  ├─ Upload images to Firebase Storage
  │   └─ For each image:
  │       ├─ Upload File to /listings/{listingId}/{imageId}
  │       └─ Get download URL
  ├─ Create Firestore document with image URLs
  └─ Return complete ApartmentListing with id and timestamps
```

**Firebase API Calls:**

```typescript
// 1. Upload image
const storageRef = ref(storage, `listings/${listingId}/${imageId}`);
await uploadBytes(storageRef, imageFile);
const url = await getDownloadURL(storageRef);

// 2. Create document
await setDoc(doc(db, 'listings', listingId), {
  title: "...",
  images: [{id, url, altText, ...}],
  createdAt: Timestamp.now(),
  ...
});
```

**Error Handling:**

- `VALIDATION_ERROR`: Invalid input data
- `STORAGE_ERROR`: Image upload failed
- `DATABASE_ERROR`: Firestore write failed

---

### 2. getListings

**Purpose:** Fetch listings with filtering, sorting, and pagination

**Complexity:** Most complex method due to Firestore query limitations

**Challenge:** Firestore queries are not as flexible as SQL/NoSQL queries

```
Standard SQL:
  SELECT * FROM listings
  WHERE state='Lagos' AND city='Ikoyi' AND rent BETWEEN 100000 AND 500000
  AND unitsAvailable >= 2
  SEARCH description LIKE '%luxurious%'
  ORDER BY createdAt DESC
  LIMIT 20 OFFSET 40

Firestore:
  ✓ WHERE conditions (with indexes)
  ✓ ORDER BY (after WHERE)
  ✗ SEARCH (requires full-text search service)
  ✓ LIMIT and OFFSET
```

**Implementation Strategy:**

```
1. Build Firestore query with:
   - Active status (required)
   - Location filters (state, city)
   - Price range filters (minRent, maxRent)
   - Units available filter
   - Role filter
   - Status filter
   - Sort order

2. Execute Firestore query:
   - Returns ALL matching documents (no pagination yet)

3. Apply in-memory filtering:
   - Full-text search on title, description, location, lister name
   - This is necessary because Firestore doesn't support LIKE queries

4. Apply pagination:
   - Slice array based on page/pageSize
   - Calculate totalPages
```

**Code Example:**

```typescript
// Build constraints
const constraints = [
  where("isActive", "==", true),
  where("location.state", "==", "Lagos"),
  where("rent", ">=", 100000),
  where("rent", "<=", 500000),
  orderBy("rent", "asc"),
];

// Execute query
const q = query(collection(db, "listings"), ...constraints);
const docs = await getDocs(q);

// Apply search filter (in-memory)
let filtered = docs.filter((doc) =>
  doc.data().title.toLowerCase().includes("ikoyi")
);

// Apply pagination
const pageSize = 20;
const page = 2;
const start = (page - 1) * pageSize;
const items = filtered.slice(start, start + pageSize);
```

**Firestore Indexes Needed:**

- For each combination of WHERE filters used together, create an index
- Example: If query filters by (state, city, rent), need index on all three

---

### 3. getListingById

**Purpose:** Fetch a single listing by ID

**Firestore API:**

```typescript
const docSnapshot = await getDoc(doc(db, 'listings', id));
if (!docSnapshot.exists()) throw NOT_FOUND error;
return mapFirestoreToListing(id, docSnapshot.data());
```

**Cost:** 1 read operation

---

### 4. updateListing

**Purpose:** Update an existing listing, potentially with new images

**Flow:**

```
Input: id, UpdateListingInput
  ├─ Fetch existing listing
  ├─ If new images provided:
  │   ├─ Delete old images from Storage
  │   └─ Upload new images and get URLs
  ├─ Merge updates with existing data
  ├─ Update Firestore document
  │   └─ Preserve: id, createdAt
  │   └─ Update: updatedAt timestamp
  └─ Return updated listing
```

**Firestore API:**

```typescript
// Update existing document (partial update)
await updateDoc(doc(db, "listings", id), {
  title: "New title",
  updatedAt: Timestamp.now(),
  // Other fields remain unchanged
});
```

**Key Feature:** `updateDoc` merges with existing data (doesn't overwrite)

---

### 5. deleteListing

**Purpose:** Delete a listing (soft delete)

**Implementation:** Mark as inactive instead of permanently deleting

**Reasons for Soft Delete:**

- Preserve historical data
- Maintain referential integrity
- Enable undelete functionality
- Comply with data retention policies

**Flow:**

```
Input: id
  ├─ Fetch listing
  ├─ Delete all images from Storage
  └─ Mark listing as inactive in Firestore
```

**Firestore API:**

```typescript
await updateDoc(doc(db, "listings", id), {
  isActive: false,
  updatedAt: Timestamp.now(),
});
```

**Cost:** 1 read + 1 write operation

---

### 6. search

**Purpose:** Full-text search with optional filters

**Implementation:** Convenience method wrapping `getListings`

```typescript
async search(query: string, filters?: Omit<ListingFilters, 'searchTerm'>) {
  return this.getListings({
    ...filters,
    searchTerm: query
  });
}
```

**Note:** For production with large datasets, integrate Algolia or Typesense

---

### 7. getListingsByUser

**Purpose:** Get all listings by a specific user

**Similar to `getListings`** but filters by `listedBy.id`

**Firestore Query:**

```typescript
const constraints = [
  where("listedBy.id", "==", userId),
  where("isActive", "==", true),
  orderBy("createdAt", "desc"),
];
```

---

## Image Handling

### Upload Process

```
User selects image file
  ├─ Generate unique imageId
  ├─ Create Storage reference: listings/{listingId}/{imageId}
  ├─ Upload file using uploadBytes()
  ├─ Get download URL using getDownloadURL()
  ├─ Store URL in Firestore document
  └─ Return ListingImage object with URL
```

### Download URLs

Firebase Storage download URLs are permanent and don't expire:

```
https://firebasestorage.googleapis.com/v0/b/{bucket}/o/listings%2F{listingId}%2F{imageId}?alt=media
```

These URLs work indefinitely and are served via Firebase's global CDN.

### Deletion Process

When deleting images:

```typescript
// Extract file path from download URL
const filePath = decodeURIComponent(url.split("/o/")[1].split("?")[0]);

// Delete using ref
const storageRef = ref(storage, filePath);
await deleteObject(storageRef);
```

---

## Data Mapping: Firestore → Domain Model

### Timestamp Conversion

Firestore stores timestamps as `Timestamp` objects, but domain models use ISO strings:

```typescript
// Firestore document
{
  createdAt: Timestamp { seconds: 1705764600, nanoseconds: 0 },
  updatedAt: Timestamp { seconds: 1705764600, nanoseconds: 0 }
}

// Convert to domain model
{
  createdAt: "2024-01-20T10:30:00.000Z",
  updatedAt: "2024-01-20T10:30:00.000Z"
}

// Code
const iso = firestoreTimestamp.toDate().toISOString();
```

### Nested Objects

Location and User objects are stored as-is (no conversion needed):

```typescript
// Firestore document
location: {
  state: "Lagos",
  city: "Ikoyi",
  address: "123 Park Lane"
}

// Domain model (identical)
location: {
  state: "Lagos",
  city: "Ikoyi",
  address: "123 Park Lane"
}
```

### Arrays

Images array stored and returned identically:

```typescript
images: [
  {
    id: "img-123-0",
    url: "https://firebasestorage.googleapis.com/...",
    altText: "Living room",
    order: 0,
  },
];
```

---

## Error Handling

### ServiceError Structure

```typescript
interface ServiceError extends Error {
  code: string; // Machine-readable error code
  statusCode: number; // HTTP-like status code
  details?: Record<string, any>; // Additional context
}
```

### Error Codes

| Code               | Status | Meaning                    |
| ------------------ | ------ | -------------------------- |
| `NOT_FOUND`        | 404    | Listing doesn't exist      |
| `VALIDATION_ERROR` | 400    | Invalid input data         |
| `STORAGE_ERROR`    | 500    | Image upload failed        |
| `DATABASE_ERROR`   | 500    | Firestore operation failed |
| `PERMISSION_ERROR` | 403    | User not authorized        |

### Usage in Components

```typescript
try {
  const listing = await service.getListingById(id);
} catch (error) {
  if (error.code === "NOT_FOUND") {
    // Show "Listing not found" message
  } else if (error.code === "STORAGE_ERROR") {
    // Show "Image upload failed" message
  } else {
    // Show generic error
  }
}
```

---

## Configuration

### ServiceConfig

```typescript
interface ServiceConfig {
  defaultPageSize?: number; // Default: 20
  enableLogging?: boolean; // Default: false
}
```

### Usage

```typescript
const service = new FirebaseListingService({
  defaultPageSize: 50,
  enableLogging: true, // For debugging
});
```

---

## Performance Characteristics

### Read Operations

| Operation                   | Firestore Calls | Cost                 | Speed        |
| --------------------------- | --------------- | -------------------- | ------------ |
| `getListingById(id)`        | 1 read          | 1 read op            | Fast (~50ms) |
| `getListings()`             | 1+ reads        | Depends on filtering | Fast-Medium  |
| `search(query)`             | 1+ reads        | Depends on filtering | Medium       |
| `getListingsByUser(userId)` | 1+ reads        | Depends on filters   | Fast-Medium  |

### Write Operations

| Operation                 | Firestore Calls                    | Cost      | Speed                          |
| ------------------------- | ---------------------------------- | --------- | ------------------------------ |
| `createListing(data)`     | N image uploads + 1 write          | N + 1 ops | Medium (depends on image size) |
| `updateListing(id, data)` | 1 read + N image uploads + 1 write | N + 2 ops | Medium                         |
| `deleteListing(id)`       | 1 read + 1 write                   | 2 ops     | Fast (~100ms)                  |

### Optimization Tips

1. **Avoid `getListings()` without filters** - returns many documents
2. **Use pagination** - always set page and pageSize
3. **Batch operations** - use writeBatch for multiple writes
4. **Index compound queries** - let Firestore suggest indexes
5. **Cache results** - use React Query or SWR for client-side caching

---

## Comparison with Mock Service

| Feature          | Mock                      | Firebase                     |
| ---------------- | ------------------------- | ---------------------------- |
| Storage          | In-memory Map             | Firestore documents          |
| Images           | URLs in memory            | Firebase Storage             |
| Queries          | JavaScript filtering      | Firestore queries            |
| Full-text search | JavaScript `.includes()`  | In-memory filtering          |
| Pagination       | In-memory slicing         | Firestore limit/offset       |
| Persistence      | Session only              | Permanent                    |
| Cost             | Free                      | Pay-as-you-go                |
| Latency          | <1ms                      | 50-200ms (network)           |
| Scalability      | Limited to browser memory | Unlimited (Firestore limits) |

---

## Known Limitations & Workarounds

### Limitation 1: No Full-Text Search in Firestore

**Problem:** Firestore doesn't support `LIKE` or regex queries

**Current Solution:** Load documents then filter in-memory (works for <1000 docs)

**Production Solution:** Use Algolia, Typesense, or Firestore Vector Search

### Limitation 2: Expensive Compound Queries

**Problem:** Need to filter by multiple fields requires indexes

**Solution:** Let Firestore suggest indexes, create them instantly

### Limitation 3: No JOIN Queries

**Problem:** Can't query across collections in one operation

**Solution:** Nest data in documents (e.g., store User info in Listing)

### Limitation 4: Read Operations Count

**Problem:** Each `getDocs()` counts as one read per document returned

**Solution:** Use pagination and filters to reduce documents queried

---

## Testing Firebase Service

### Unit Test Example

```typescript
import { FirebaseListingService } from './firebaseListingService';

describe('FirebaseListingService', () => {
  let service: FirebaseListingService;

  beforeEach(() => {
    service = new FirebaseListingService({
      enableLogging: false
    });
  });

  it('should create a listing', async () => {
    const result = await service.createListing({
      title: 'Test',
      // ... other fields
      images: []
    });

    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });

  it('should fetch listing by ID', async () => {
    // First create
    const created = await service.createListing({...});

    // Then fetch
    const fetched = await service.getListingById(created.id);
    expect(fetched.id).toBe(created.id);
  });

  it('should handle NOT_FOUND error', async () => {
    await expect(
      service.getListingById('nonexistent')
    ).rejects.toHaveProperty('code', 'NOT_FOUND');
  });
});
```

### Integration Test Example

```typescript
// Use Firebase Emulator for testing
beforeAll(async () => {
  const app = initializeApp({
    projectId: "test-project",
  });
  connectFirestoreEmulator(getFirestore(app), "localhost", 8080);
});

// Tests run against emulator (no cloud costs)
```

---

## Monitoring & Logging

### Enable Logging

```typescript
const service = new FirebaseListingService({
  enableLogging: true,
});

// Console output:
// [FirebaseListingService.createListing] {title: "..."}
// [FirebaseListingService.getListings] {filters: {...}}
```

### Monitor Firestore Usage

1. Firebase Console > Firestore > Monitors
2. Track read/write/delete operations
3. Monitor storage usage
4. Set usage alerts

### Monitor Storage Usage

1. Firebase Console > Storage
2. View file sizes and counts
3. Monitor bandwidth usage
4. Set storage alerts

---

## Migration Rollback

If issues arise, rollback to Mock service:

```env
# .env
REACT_APP_BACKEND=mock
```

No code changes needed. Service factory handles it automatically.

Data remains in Firestore for reference or manual migration.

---

## Production Checklist

Before deploying to production:

- [ ] Firebase project created and configured
- [ ] Firestore database in production mode
- [ ] Cloud Storage bucket created
- [ ] Security rules properly configured
- [ ] Compound indexes created (or auto-creation enabled)
- [ ] Environment variables set correctly
- [ ] Firebase SDK installed
- [ ] `initializeFirebase()` called in App.tsx
- [ ] All service methods tested
- [ ] Error handling tested
- [ ] Image upload/delete tested
- [ ] Pagination tested
- [ ] Filters tested
- [ ] Performance acceptable (<200ms response times)
- [ ] Cost estimate reviewed
- [ ] Monitoring and logging configured
- [ ] Backup strategy planned (Firestore backups)
- [ ] Support plan in place

---

## Next Steps

After Firebase deployment:

1. **Add Authentication** - Secure listings creation/editing
2. **Real-time Sync** - Use Firestore listeners for live updates
3. **Advanced Search** - Integrate Algolia for better search
4. **Analytics** - Track user behavior
5. **Cloud Functions** - Server-side logic (image optimization, notifications)
6. **Caching** - Reduce Firestore reads with React Query/SWR
