# Backend-Agnostic Architecture Guide

## Overview

This document explains the architecture pattern used to keep your React UI completely decoupled from backend implementation details. This ensures you can migrate from Firebase to Supabase to a REST API without touching a single line of UI code.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│         React Components (UI Layer)             │
│  ├─ Home.tsx                                    │
│  ├─ ApartmentDetails.tsx                        │
│  └─ ListProperty.tsx                            │
└────────────────┬────────────────────────────────┘
                 │ (imports useListingService hook)
                 ▼
┌─────────────────────────────────────────────────┐
│      Custom Hooks (Integration Layer)           │
│  └─ useListingService.ts                        │
│     └─ handles initialization & caching         │
└────────────────┬────────────────────────────────┘
                 │ (returns service instance)
                 ▼
┌─────────────────────────────────────────────────┐
│     Service Layer (Business Logic)              │
│  ├─ listingService.ts (factory)                 │
│  └─ types.ts (IListingService interface)        │
└────────────────┬────────────────────────────────┘
                 │ (implements interface)
                 ▼
┌─────────────────────────────────────────────────┐
│   Service Implementations (Swappable)           │
│  ├─ mockListingService.ts (current)             │
│  ├─ firebaseListingService.ts (future)          │
│  ├─ supabaseListingService.ts (future)          │
│  └─ restListingService.ts (future)              │
└────────────────┬────────────────────────────────┘
                 │ (reads/writes data)
                 ▼
┌─────────────────────────────────────────────────┐
│        Domain Models (Data Layer)               │
│  └─ models/domain.ts                            │
│     ├─ ApartmentListing                         │
│     ├─ User                                     │
│     ├─ Location                                 │
│     └─ PaginatedResult<T>                       │
└─────────────────────────────────────────────────┘
```

## Why This Architecture Works

### 1. **Dependency Inversion**

- UI depends on interfaces (IListingService), not concrete implementations
- Implementations can change without affecting UI code
- Following SOLID principles ensures maintainability

### 2. **Single Responsibility**

- **Domain Models**: Pure data structures, no business logic
- **Service Interface**: Contract defining what operations are possible
- **Service Implementation**: How operations are executed (replaceable)
- **Hooks**: React integration for managing service lifecycle
- **Components**: Display logic only

### 3. **Backend Agnostic Design**

- Domain models use plain TypeScript interfaces
- No Firebase, Supabase, or SDK types leak into UI
- All data is transformed to domain models before reaching components
- Adapters handle format conversion if needed

## File Structure

```
src/
├── models/
│   └── domain.ts                 # Core domain models (pure TS interfaces)
│
├── services/
│   ├── types.ts                  # IListingService interface contract
│   ├── listingService.ts         # Service factory & initialization
│   │
│   ├── implementations/
│   │   ├── mockListingService.ts # Current: in-memory implementation
│   │   ├── firebaseListingService.ts    # Future: Firebase
│   │   ├── supabaseListingService.ts    # Future: Supabase
│   │   └── restListingService.ts        # Future: REST API
│   │
│   └── adapters/
│       └── mockDataAdapter.ts    # Converts legacy data to domain models
│
├── hooks/
│   └── useListingService.ts      # React integration hook
│
├── pages/
│   ├── Home.tsx                  # Uses service via hook
│   ├── ApartmentDetails.tsx
│   └── ListProperty.tsx
│
└── components/
    ├── ApartmentCard.tsx
    ├── Header.tsx
    └── Footer.tsx
```

## How to Use the Service Layer

### In React Components

```typescript
import { useListingService } from "../hooks/useListingService";
import type { ApartmentListing } from "../models/domain";

export function MyComponent() {
  const { service, loading, error } = useListingService();
  const [listings, setListings] = useState<ApartmentListing[]>([]);

  useEffect(() => {
    if (!service) return;

    const fetchData = async () => {
      try {
        // Service returns plain domain models
        const result = await service.getListings({
          state: "Lagos",
          maxPrice: 500000,
          page: 1,
          pageSize: 20,
        });

        setListings(result.items);
      } catch (err) {
        console.error("Failed to fetch:", err);
      }
    };

    fetchData();
  }, [service]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {listings.map((listing) => (
        <ApartmentCard key={listing.id} apartment={listing} />
      ))}
    </div>
  );
}
```

**Key Points:**

- Component never imports backend SDK (no Firebase, Supabase, etc.)
- Component only knows about domain models and the IListingService interface
- Data fetching is always async (ready for network requests)

## Migrating to a Different Backend

### Example: Firebase Migration

**Step 1: Create Firebase Implementation**

```typescript
// src/services/implementations/firebaseListingService.ts

import type { IListingService, ServiceConfig } from "../types";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export class FirebaseListingService implements IListingService {
  private db: Firestore;

  constructor(config: ServiceConfig) {
    const app = initializeApp({
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      // ... other config
    });
    this.db = getFirestore(app);
  }

  async getListings(
    filters?: ListingFilters
  ): Promise<PaginatedResult<ApartmentListing>> {
    const ref = collection(this.db, "listings");
    const snapshot = await getDocs(ref);

    // Transform Firestore data to domain models
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ApartmentListing[];

    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
      hasMore: false,
    };
  }

  // ... implement other methods
}
```

**Step 2: Update Service Factory**

```typescript
// src/services/listingService.ts

import { FirebaseListingService } from "./implementations/firebaseListingService";

export async function initializeListingService(): Promise<IListingService> {
  if (listingServiceInstance) return listingServiceInstance;

  // Just change this line - everything else stays the same
  const service = new FirebaseListingService({
    defaultPageSize: 20,
    enableLogging: false,
  });

  listingServiceInstance = service;
  return service;
}
```

**Step 3: Done!**

- No changes to React components
- No changes to Home.tsx, ApartmentDetails.tsx, etc.
- Everything works with Firebase instead of mock data

### Example: Supabase Migration

Same process - create `SupabaseListingService`, update the factory, done.

## Service Interface Methods

### getListings(filters?: ListingFilters)

Fetch listings with optional filtering, sorting, and pagination.

```typescript
const result = await service.getListings({
  searchTerm: 'ikoyi',
  state: 'Lagos',
  maxPrice: 500000,
  minUnitsAvailable: 2,
  sortBy: 'price',
  sortOrder: 'asc',
  page: 1,
  pageSize: 20
});

// Returns:
{
  items: [...listings],
  total: 150,
  page: 1,
  pageSize: 20,
  totalPages: 8,
  hasMore: true,
  nextCursor: "2"
}
```

### getListingById(id: string)

Fetch a single listing by ID.

```typescript
const listing = await service.getListingById("apt-123");
```

### createListing(data: CreateListingInput)

Create a new listing.

```typescript
const newListing = await service.createListing({
  title: "3-Bed in Victoria Island",
  description: "...",
  price: 750000,
  location: { state: 'Lagos', city: 'VI', address: '...' },
  images: [...],
  bedrooms: 3,
  bathrooms: 2,
  unitsAvailable: 1,
  amenities: ['Pool', 'Gym'],
  listedBy: { id: 'user-1', name: 'John', role: 'agent', ... }
});
```

### updateListing(id: string, data: UpdateListingInput)

Update a listing (partial update).

```typescript
const updated = await service.updateListing("apt-123", {
  price: 550000,
  unitsAvailable: 0,
});
```

### deleteListing(id: string)

Delete a listing.

```typescript
await service.deleteListing("apt-123");
```

### search(query: string, filters?: Omit<ListingFilters, 'searchTerm'>)

Convenience method for full-text search.

```typescript
const results = await service.search("luxury apartment ikoyi", {
  maxPrice: 1000000,
  page: 1,
});
```

### getListingsByUser(userId: string, filters?: ListingFilters)

Get all listings by a specific user.

```typescript
const userListings = await service.getListingsByUser("user-456");
```

## Error Handling

All methods throw `ServiceError` with standardized error codes:

```typescript
try {
  const listing = await service.getListingById("invalid-id");
} catch (err) {
  if (err.code === "NOT_FOUND") {
    // Handle 404
  } else if (err.code === "VALIDATION_ERROR") {
    // Handle validation
  }

  console.log(err.statusCode); // HTTP-like status code
  console.log(err.details); // Additional error details
}
```

## Why This Ensures Migration Safety

### 1. **No SDK Dependencies in UI**

- Components never import `firebase`, `@supabase/supabase-js`, etc.
- All backend code is isolated to `/services/implementations/`
- Migration only affects isolated modules

### 2. **Domain Models Are Universal**

- `ApartmentListing`, `User`, `Location` are plain TypeScript interfaces
- Work with any backend (SQL, NoSQL, REST, GraphQL)
- No ORM-specific annotations or decorators

### 3. **Interface Contract Is Explicit**

- `IListingService` defines exactly what operations are available
- Any new backend must implement these methods
- Incompatible backends are caught at compile time

### 4. **Async Everywhere**

- All methods are async, ready for network calls
- Mock implementation is async, no code changes needed
- Components expect promises, works with any backend

### 5. **Layered Testing**

- Mock service works offline, perfect for development
- Can test components without backend running
- Can test service implementations independently
- Swap implementations in test setup

## Future Enhancements

### 1. Caching Layer

Add caching decorator pattern:

```typescript
class CachedListingService implements IListingService {
  constructor(private innerService: IListingService) {}

  async getListings(filters?: ListingFilters) {
    const cacheKey = JSON.stringify(filters);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await this.innerService.getListings(filters);
    this.cache.set(cacheKey, result);
    return result;
  }
  // ...
}
```

### 2. Offline Support

Wrap any service with offline detection:

```typescript
class OfflineAwareService implements IListingService {
  constructor(
    private onlineService: IListingService,
    private offlineService: IListingService
  ) {}

  async getListings(filters?: ListingFilters) {
    if (navigator.onLine) {
      return this.onlineService.getListings(filters);
    } else {
      return this.offlineService.getListings(filters);
    }
  }
  // ...
}
```

### 3. Retry & Circuit Breaker

Wrap service calls with retry logic without changing implementation

### 4. Analytics Integration

Log all service calls without modifying core logic

## Summary

**Before This Architecture:**

- UI directly imported mockData
- Changing to Firebase meant rewriting components
- Backend SDK types scattered throughout code
- Hard to test, hard to migrate

**After This Architecture:**

- UI imports useListingService hook
- Changing backends is a 2-line change in listingService.ts
- All backend code isolated to /services/implementations/
- Components are testable and backend-agnostic
- Clear separation of concerns

This is production-grade architecture used by enterprise teams building scalable, maintainable applications.
