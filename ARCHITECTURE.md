# ARCHITECTURE & IMPLEMENTATION GUIDE

## Project Overview

This document explains the architectural decisions and implementation details of the NigiaApt real estate platform.

## 🎯 MVP Philosophy

This MVP focuses on:

1. **Clean Code**: Well-organized, readable, maintainable
2. **Scalability**: Structure supports adding features without major refactors
3. **Type Safety**: TypeScript prevents runtime errors
4. **User Experience**: Responsive, fast, intuitive interface
5. **No Backend**: Uses local/mock data - easy transition to real API

## 📊 Technology Rationale

### React 19 + TypeScript

**Why**:

- **React 19** Latest improvements in hooks and performance
- **TypeScript** Prevents bugs, improves IDE autocomplete, self-documents code
- **Trade-offs**: More setup, but long-term maintainability is worth it

### Vite (not Create React App)

**Why**:

- **Speed**: 5-10x faster dev server startup
- **Modern ESM**: Uses native ES modules in development
- **Future-proof**: Industry standard, active maintenance
- **Small bundle**: ~150KB vs 300KB+ with CRA

### Tailwind CSS (not Bootstrap)

**Why**:

- **Flexibility**: Utility classes = infinite design possibilities
- **Small bundle**: Only unused styles are removed
- **Nigerian scalability**: Easy to customize for local branding
- **Consistency**: Design tokens prevent style chaos
- **Learning**: Standard in modern startups

### React Router v6 (not Next.js)

**Why for MVP**:

- **Lightweight**: Minimal overhead for simple SPA
- **Full control**: No framework opinions forced
- **Learning**: Core React + routing fundamentals
- **Future**: Easy path to Next.js when needed

### React Hooks (not Redux)

**Why for MVP**:

- **Simplicity**: No boilerplate for 3 pages
- **Learning**: Master React before state libraries
- **Performance**: `useMemo` is sufficient for filtering
- **Path forward**: Simple to migrate to Redux/Zustand later

## 🏗️ Architecture Layers

### Component Layer (`/components`)

**Responsibility**: Reusable, presentational UI elements

**Examples**:

- `Header.tsx`: Navigation bar (no business logic)
- `Button.tsx`: Styled button with variants
- `ApartmentCard.tsx`: Display apartment summary

**Pattern**: Props in, JSX out. No side effects.

```tsx
// Good: Presentational component
function ApartmentCard({ apartment }: Props) {
  return <div>... display data ...</div>;
}

// Bad: Component with business logic
function ApartmentCard({ id }) {
  const [apt, setApt] = useState(null);
  useEffect(() => {
    /* fetch from API */
  }, [id]);
  return <div>...</div>;
}
```

### Page Layer (`/pages`)

**Responsibility**: Full-page components that compose smaller components

**Examples**:

- `Home.tsx`: Lists apartments with search/filter
- `ApartmentDetails.tsx`: Shows single apartment
- `ListProperty.tsx`: Multi-step form

**Pattern**: Fetch data, manage page state, compose components

```tsx
export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");

  const filtered = useMemo(() => {
    // Filter logic
  }, [searchTerm, selectedState]);

  return (
    <div>
      <Header />
      <section>
        <input onChange={(e) => setSearchTerm(e.target.value)} />
        <Grid items={filtered} />
      </section>
    </div>
  );
}
```

### Type Layer (`/types`)

**Responsibility**: TypeScript interfaces for data structures

**Current**:

```tsx
export interface Apartment {
  id: string;
  title: string;
  rent: number; // in Naira
  location: { state: string; city: string; address: string };
  images: string[];
  bedrooms: number;
  amenities: string[];
  // ... more fields
}
```

**Benefits**:

- Props typing prevents bugs
- IntelliSense in IDE
- Self-documents expected data shape

### Data Layer (`/data`)

**Responsibility**: Mock/static data

**Current**: 6 sample apartments with Nigerian data

**Why mock data**:

- Develop without backend
- Test UI with realistic content
- Easy to replace with API calls later

```tsx
// Current: Static array
export const mockApartments: Apartment[] = [...]

// Future: Replace with API call
export const mockApartments = async () => {
  const res = await fetch('/api/apartments')
  return res.json()
}
```

### Routing Layer (`/App.tsx`)

**Responsibility**: Map URLs to pages

**Current structure**:

```tsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/apartment/:id" element={<ApartmentDetails />} />
  <Route path="/list-property" element={<ListProperty />} />
</Routes>
```

**Future additions**:

- Authentication routes
- Admin routes
- Error boundary route

## 🔄 Data Flow Pattern

### Example: Filtering on Home Page

```
User types in search →
setSearchTerm(value) →
Re-render with new state →
useMemo recalculates filtered array →
Grid re-renders with new items
```

```tsx
// 1. State management
const [searchTerm, setSearchTerm] = useState('') // User input

// 2. Derived state (cached with useMemo)
const filtered = useMemo(() => {
  return mockApartments.filter(apt =>
    apt.title.includes(searchTerm)
  )
}, [searchTerm]) // Only recalculate when searchTerm changes

// 3. UI updates when filtered changes
<div>
  <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
  <Grid items={filtered} />
</div>
```

**Why useMemo?**:

- Filter logic runs on every render without it
- With 1000s of apartments, this is slow
- useMemo caches result = fast re-renders

## 🎨 Styling Strategy

### Tailwind CSS Structure

```css
/* index.css */
@tailwind base; /* Browser resets */
@tailwind components; /* Reusable classes */
@tailwind utilities; /* Utility classes */

@layer components {
  .btn-primary {
    /* Custom button styles */
  }
  .card {
    /* Custom card styles */
  }
}
```

### Class Naming Convention

```tsx
// Tailwind utilities directly
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
  Primary Button
</button>

// Complex components → @layer components (DRY)
<button className="btn-primary">Primary Button</button>

// Responsive tailwind
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
</div>
```

## 📱 Responsive Design

### Mobile-First Approach

```tsx
// Default is mobile, add lg: for desktop
<div className="p-4 lg:p-8">Padding 4 on mobile, 8 on desktop</div>
<div className="grid grid-cols-1 lg:grid-cols-3">1 col mobile, 3 cols desktop</div>
```

### Breakpoints Used

- Default: Mobile (320px+)
- `sm:` (640px+): Small tablets
- `md:` (768px+): Tablets
- `lg:` (1024px+): Desktop
- `xl:` (1280px+): Large screens

## 🔐 Type Safety Examples

### Bad (Runtime Error Risk)

```tsx
// apartment could be undefined
const apartment = mockApartments.find((a) => a.id === id);
const rent = apartment.rent; // Crash if apartment is null!
```

### Good (Type Safe)

```tsx
type Props = { apartment?: Apartment | null };

function Component({ apartment }: Props) {
  if (!apartment) return <div>Not found</div>;
  const rent = apartment.rent; // Type-safe, no crash
}
```

## 📈 Performance Considerations

### Current Optimizations

1. **useMemo**: Caches filter results
2. **Image optimization**: Uses modern image formats
3. **Vite code splitting**: Each route can be lazy-loaded (future)

### Scalability Concerns (Future)

- 1000+ apartments → Pagination/virtualization needed
- Large images → CDN + lazy loading
- Complex filtering → Elasticsearch/database indexing

### Monitoring Points

```tsx
// Log renders during development
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    console.log("Home rendered");
  });
  // ... rest of component
}
```

## 🔄 Component Reusability

### ApartmentCard Example

```tsx
// Used in:
// 1. Home page grid
<Grid items={apartments}>{(apt) => <ApartmentCard apartment={apt} />}</Grid>

// 2. Search results
// 3. Future: Favorites page

// One component, multiple contexts
```

### Button Example

```tsx
// Primary action
<Button variant="primary">Submit</Button>

// Secondary action
<Button variant="secondary">Cancel</Button>

// Disabled state
<Button disabled>Loading...</Button>

// One component, multiple states
```

## 🚀 Deployment Strategy

### Development

```bash
npm run dev → localhost:5173
```

### Production

```bash
npm run build → Creates dist/ folder with optimized code
npm run preview → Test production build locally

# Deploy dist/ to:
# - Vercel (auto-deploys from Git)
# - Netlify (drag & drop or Git)
# - GitHub Pages (static hosting)
```

## 🔗 API Integration Plan (Future)

### Current (Mock)

```tsx
// src/data/mockData.ts
export const mockApartments = [...]
```

### Phase 1 (API Integration)

```tsx
// src/hooks/useApartments.ts
export function useApartments() {
  const [apartments, setApartments] = useState([]);
  useEffect(() => {
    fetch("/api/apartments")
      .then((r) => r.json())
      .then(setApartments);
  }, []);
  return apartments;
}

// Usage in Home.tsx
const apartments = useApartments();
```

### Phase 2 (Production API)

```tsx
// .env
VITE_API_URL=https://api.nigiapt.ng

// src/api/client.ts
export async function getApartments(filters) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/apartments?...`)
  return res.json()
}

// Usage
import { getApartments } from '@/api/client'
const apartments = await getApartments(filters)
```

## 📚 Learning Resources

### TypeScript

- https://www.typescriptlang.org/docs/handbook/
- Focus: interfaces, generics, type narrowing

### React Hooks

- https://react.dev/reference/react
- Key: useState, useEffect, useMemo, useCallback

### Tailwind CSS

- https://tailwindcss.com/docs
- Key: responsive design, dark mode, customization

### React Router

- https://reactrouter.com/
- Key: useParams, useNavigate, nested routes

## ✅ Quality Checklist

Before shipping to production:

- [ ] No console.errors in production build
- [ ] TypeScript strict mode enabled
- [ ] All routes tested manually
- [ ] Mobile responsive on iPhone 12 / Android
- [ ] Images optimized (< 200KB each)
- [ ] Accessibility: keyboard navigation works
- [ ] Performance: Lighthouse score > 90
- [ ] SEO: Meta tags for social sharing

## 🤝 Contributing Guidelines

### File Organization

- One component per file
- File name = Component name (PascalCase)
- Types in separate `types/` folder

### Code Style

```tsx
// Import React (not needed in React 19+, but good practice)
import { useState, useMemo } from "react";

// Import types with type keyword
import type { Apartment } from "@/types/apartment";

// Component declaration
export default function MyComponent() {
  return <div>...</div>;
}
```

### Comments

- Add comment above component explaining purpose
- Add comment for complex logic
- Avoid obvious comments

```tsx
/**
 * Filters apartments based on user search and selected state
 * Uses useMemo to avoid recalculating on every render
 */
const filtered = useMemo(() => {
  // Complex logic here
}, [dependencies]);
```

---

**This structure scales from MVP → 10+ developers working on production platform**
