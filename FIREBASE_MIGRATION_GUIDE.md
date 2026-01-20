# Firebase Migration Guide

A complete guide to migrating from MockListingService to FirebaseListingService.

## Overview

This project uses a backend-agnostic architecture that makes migrating to Firebase trivial:

- **Domain models** are independent of any backend
- **Service interface** defines the contract
- **Multiple implementations** can be swapped easily
- **UI code** never touches backend-specific code

Switching to Firebase requires only **environment variable changes** - no code modifications needed.

---

## Architecture Comparison

### Before: Mock Service

```typescript
// In-memory storage only
const apartmentListings: Map<string, ApartmentListing> = new Map();

// Synchronous filtering, sorting, pagination
export async getListings(filters?: ListingFilters): Promise<...> {
  // In-memory query logic
}
```

### After: Firebase Service

```typescript
// Firestore document storage
const db = getFirestore();
const listings = collection(db, 'listings');

// Firestore queries with indexes
export async getListings(filters?: ListingFilters): Promise<...> {
  // Firestore queries + in-memory post-processing
}
```

**Key difference:** Same interface, different implementation. UI doesn't know the difference.

---

## Installation & Setup

### Step 1: Install Firebase SDK

```bash
npm install firebase
```

### Step 2: Configure Environment Variables

Create `.env` file in your project root:

```env
# Backend selection
REACT_APP_BACKEND=firebase

# Firebase configuration
# Get these from Firebase Console > Project Settings
REACT_APP_FIREBASE_API_KEY=AIzaSyBpqzR6234567890abcdefghijklmnopqrs
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-12345
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-12345.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abc

# Optional: Use Firebase Emulator for local development
REACT_APP_USE_FIREBASE_EMULATOR=false
```

**Where to find these values:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Project Settings" (⚙️ gear icon)
4. Click "General" tab
5. Scroll down to "Your apps" section
6. Find your web app and copy the config object
7. Map each field to the environment variable above

### Step 3: Initialize Firebase

In your main `App.tsx` or entry point:

```typescript
import { useEffect } from "react";
import { initializeFirebase } from "./config/firebase";

export function App() {
  useEffect(() => {
    // Initialize Firebase once on app startup
    initializeFirebase();
  }, []);

  // ... rest of component
}
```

### Step 4: Done!

The service factory automatically detects `REACT_APP_BACKEND=firebase` and uses `FirebaseListingService`.

---

## Firebase Console Setup

### Create Firestore Database

1. Open Firebase Console
2. Go to Firestore Database
3. Click "Create database"
4. Choose "Start in production mode" (then add security rules)
5. Select region (use a region close to your users)

### Create Storage Bucket

1. Open Firebase Console
2. Go to Cloud Storage
3. Click "Create bucket"
4. Use same region as Firestore
5. Choose "Start in production mode" (then add security rules)

### Create Collections

Firestore doesn't require pre-creating collections, but you can:

1. Go to Firestore Database
2. Click "Start collection"
3. Create collection named `listings`
4. Add one test document (will be shown in examples below)

The `FirebaseListingService` will create the `listings` collection automatically on first write.

---

## Firestore Structure

### Document Schema

Each listing in Firestore looks like:

```javascript
// Document path: /listings/{id}
{
  title: "Modern 3-Bed in Ikoyi",
  description: "Spacious apartment with excellent amenities",
  rent: 500000,
  location: {
    state: "Lagos",
    city: "Ikoyi",
    address: "123 Park Lane, Ikoyi",
    coordinates: {
      latitude: 6.4637,
      longitude: 3.6158
    }
  },
  bedrooms: 3,
  bathrooms: 2,
  unitsAvailable: 2,
  amenities: ["WiFi", "Pool", "Gym", "Generator"],
  images: [
    {
      id: "img-123-0",
      url: "https://firebasestorage.googleapis.com/v0/b/...",
      altText: "Living room",
      order: 0,
      thumbnailUrl: "https://firebasestorage.googleapis.com/v0/b/..."
    }
  ],
  listedBy: {
    id: "user-456",
    name: "John Doe",
    role: "agent",
    phone: "+2348012345678",
    email: "john@example.com",
    company: "Elite Properties"
  },
  status: "available",
  isActive: true,
  createdAt: 2024-01-20T10:30:00.000Z,  // Server timestamp
  updatedAt: 2024-01-20T10:30:00.000Z   // Server timestamp
}
```

### Image Storage Path

Images are stored in Cloud Storage at:

```
/listings/{listingId}/{imageId}
```

Example:

```
/listings/apt-123/img-123-0
/listings/apt-123/img-123-1
/listings/apt-123/img-123-2
```

---

## Firestore Indexes

Firestore automatically creates single-field indexes. For multi-field queries, you need compound indexes.

### Auto-Suggested Indexes

When you run queries that need indexes, Firestore will:

1. Log an error with a link to create the index
2. Show exactly which index is needed
3. Click the link to create it instantly

### Manual Index Creation

If indexes don't auto-suggest, create them manually:

**Index 1: Location + Status Filtering**

```
Collection: listings
Fields:
- location.state (Ascending)
- status (Ascending)
- createdAt (Descending)
```

**Index 2: Price Range Filtering**

```
Collection: listings
Fields:
- isActive (Ascending)
- rent (Ascending)
- createdAt (Descending)
```

**Index 3: Location-based Filtering**

```
Collection: listings
Fields:
- location.state (Ascending)
- location.city (Ascending)
- rent (Ascending)
```

**Index 4: User's Listings**

```
Collection: listings
Fields:
- listedBy.id (Ascending)
- isActive (Ascending)
- createdAt (Descending)
```

---

## Security Rules

### Firestore Security Rules

Replace the default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access to active listings
    match /listings/{listing=**} {
      allow read: if true;

      // Authenticated users can create listings
      allow create: if request.auth != null;

      // Users can only update their own listings
      allow update: if request.auth.uid == resource.data.listedBy.id;

      // Users can only delete their own listings
      allow delete: if request.auth.uid == resource.data.listedBy.id;
    }
  }
}
```

### Firebase Storage Rules

Replace the default Storage rules with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read for images
    match /listings/{allPaths=**} {
      allow read: if true;

      // Authenticated users can upload
      allow write: if request.auth != null;
    }
  }
}
```

---

## Environment Variables Reference

### Development (Mock Service)

```env
REACT_APP_BACKEND=mock
# No Firebase config needed
```

### Production (Firebase)

```env
REACT_APP_BACKEND=firebase
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Optional Settings

```env
# Enable Firebase Emulator for local development
REACT_APP_USE_FIREBASE_EMULATOR=false

# Logging (development)
REACT_APP_DEBUG=false
```

---

## Local Development with Emulator

For faster development without Firebase costs, use the Firebase Emulator.

### Install Emulator

```bash
npm install -g firebase-tools
firebase emulators:start --only firestore,storage
```

### Enable in App

```env
REACT_APP_USE_FIREBASE_EMULATOR=true
```

The `firebase.ts` config will automatically connect to `localhost:8080` (Firestore) and `localhost:9199` (Storage).

---

## Migration Checklist

- [ ] Install Firebase SDK: `npm install firebase`
- [ ] Create Firebase project (or use existing)
- [ ] Create Firestore database (production mode)
- [ ] Create Cloud Storage bucket
- [ ] Get Firebase config from Firebase Console
- [ ] Create `.env` file with Firebase config
- [ ] Set `REACT_APP_BACKEND=firebase` in `.env`
- [ ] Import and call `initializeFirebase()` in App.tsx
- [ ] Run dev server: `npm run dev`
- [ ] Create a test listing through UI
- [ ] Verify listing appears in Firestore Console
- [ ] Verify images appear in Storage Console
- [ ] Set Firestore security rules
- [ ] Set Storage security rules
- [ ] Create required compound indexes
- [ ] Test all features (create, read, update, delete, search, filter)
- [ ] Test pagination
- [ ] Deploy to production

---

## Verification Steps

### 1. Verify Service Initialization

Check browser console:

```
[ServiceFactory] Initializing firebase backend...
[Firebase] Initialized successfully
```

### 2. Verify Listings Load

- Visit home page
- Should see listings from Firestore (not mock data)
- Filters should work in real-time

### 3. Verify Create Operation

```typescript
const { service } = useListingService();
const newListing = await service.createListing({
  title: "Test Listing",
  // ... other fields
  images: [
    /* File or ListingImage */
  ],
});
// Check Firebase Console > Firestore > listings > {id}
// Check Firebase Console > Storage > listings > {newListing.id}
```

### 4. Verify Filters

- Open home page
- Try searching: should filter active listings only
- Try state filter: should match Firestore documents
- Try price range: should work correctly
- Try units filter: should work correctly

### 5. Verify Pagination

```typescript
const results = await service.getListings({
  page: 1,
  pageSize: 10,
});

console.log(results.totalPages); // Should match document count
console.log(results.hasMore); // Should be correct
```

---

## Troubleshooting

### Firebase Not Initializing

**Error:** `[Firebase] Not initialized. Call initializeFirebase() first.`

**Solution:**

```typescript
// App.tsx
useEffect(() => {
  initializeFirebase(); // Call BEFORE creating service
}, []);
```

### Environment Variables Not Loading

**Error:** Firebase config values are empty strings

**Solutions:**

1. Make sure `.env` file is in project root (same level as `package.json`)
2. Variables must start with `REACT_APP_`
3. Restart dev server after changing `.env`
4. Check spelling: `REACT_APP_FIREBASE_API_KEY` (not `REACT_APP_FirebaseApiKey`)

### Firestore Queries Failing

**Error:** `FAILED_PRECONDITION: The query requires an index.`

**Solution:**

- Click the link in the error message
- Or manually create the index in Firebase Console > Firestore > Indexes

### Images Not Uploading

**Error:** `PERMISSION_DENIED: Storage bucket not found`

**Solutions:**

1. Check Cloud Storage bucket exists and is in same region as Firestore
2. Check Storage security rules allow authenticated writes
3. Verify user is authenticated (if using authentication)

### Out of Storage Quota

**Solution:**

1. Delete old test images from Firebase Console > Storage
2. Or upgrade to paid plan (Firebase Spark plan is free up to 5GB)

---

## Performance Tips

### 1. Use Pagination

```typescript
// Good: paginated
const results = await service.getListings({ page: 1, pageSize: 20 });

// Bad: loading all documents
const results = await service.getListings({ pageSize: 10000 });
```

### 2. Index Frequently-Queried Fields

Common filters should be indexed:

- `location.state`
- `location.city`
- `rent`
- `createdAt`
- `listedBy.id`

### 3. Avoid In-Memory Search

The current implementation does full-text search in memory (reads all documents then filters). For large datasets, integrate a search service:

- **Algolia** (easiest, serverless)
- **Typesense** (self-hosted option)
- **Elasticsearch** (powerful but complex)

### 4. Cache Images

```typescript
// Firebase Storage automatically caches downloads
// Images served via Firebase's CDN are fast
// No additional caching needed
```

---

## Cost Considerations

### Firebase Spark Plan (Free)

- ✅ 1GB Firestore storage
- ✅ 5GB Cloud Storage
- ❌ Limited to US region
- Perfect for development

### Firebase Blaze Plan (Pay-as-you-go)

- Per read/write operations
- ~$0.06 per 100,000 reads
- ~$0.18 per 100,000 writes
- Per GB stored

### Estimating Costs

Example app with 10,000 apartments:

```
Storage:
- 10,000 docs × 2KB = 20MB
- 10,000 listings × 3 images × 500KB = 15GB
- Monthly cost: ~$0.30 + storage costs

Operations (monthly):
- Reads: ~100,000 = $0.06
- Writes: ~1,000 = $0.00
- Monthly cost: ~$0.06

Total: ~$0.36/month + storage
```

---

## Rollback to Mock

If you need to switch back to mock service:

```env
REACT_APP_BACKEND=mock
# Remove Firebase config
```

No code changes needed. The service factory automatically handles it.

---

## Next Steps

After migration to Firebase:

1. **Add Authentication** - Implement Firebase Auth for user-specific features
2. **Add Real-time Sync** - Use Firestore listeners for live updates
3. **Add Search** - Integrate Algolia for full-text search
4. **Add Analytics** - Track user behavior with Firebase Analytics
5. **Add Functions** - Server-side logic with Cloud Functions
6. **Scale Globally** - Configure replica zones for low latency

---

## Additional Resources

- [Firebase Console](https://console.firebase.google.com)
- [Firebase JS SDK Docs](https://firebase.google.com/docs/web/setup)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Cloud Storage Guide](https://firebase.google.com/docs/storage)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Security Rules Simulator](https://firebase.google.com/docs/rules/simulator)

---

## Support

For issues with Firebase setup:

1. Check [Firebase Status](https://status.firebase.google.com)
2. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase)
3. Check [Firebase Docs](https://firebase.google.com/docs)
4. File issue on [Firebase GitHub](https://github.com/firebase/firebase-js-sdk/issues)
