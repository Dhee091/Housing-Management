# NigiaApt - Nigerian Real Estate Rental Platform

A modern React-based web application for browsing and listing rental apartments across Nigeria. Built as an MVP with focus on clean architecture, reusable components, and excellent user experience.

## 🎯 Project Overview

**NigiaApt** is a real estate listing platform specifically designed for Nigerian rental apartments. This MVP focuses on:

- **Apartment Browsing**: Search and filter rental properties by location and price
- **Property Details**: View comprehensive apartment information with image gallery
- **Property Listing**: Agents and owners can list properties with a multi-step form
- **Clean Architecture**: Well-organized component structure ready for scaling
- **Nigerian Market**: Mock data featuring real Nigerian cities and realistic rental prices

### Tech Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7 (fast development experience)
- **Styling**: Tailwind CSS v3 (utility-first CSS framework)
- **Routing**: React Router v6 (client-side navigation)
- **State Management**: React Hooks (useState, useMemo for local state)

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation bar
│   ├── Footer.tsx      # Footer with links
│   ├── ApartmentCard.tsx # Property listing card
│   └── Button.tsx      # Reusable button component
├── pages/              # Full-page components/routes
│   ├── Home.tsx        # Main listing page with search/filter
│   ├── ApartmentDetails.tsx  # Property detail page
│   └── ListProperty.tsx # Multi-step form for listing
├── types/              # TypeScript interfaces
│   └── apartment.ts    # Apartment and form data types
├── data/               # Static/mock data
│   └── mockData.ts     # 6 sample Nigerian apartments
├── hooks/              # Custom React hooks (for future use)
├── App.tsx             # Main app component with routing
├── main.tsx            # React entry point
└── index.css           # Global styles with Tailwind
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm 7+ or yarn

### Installation

1. **Navigate to project directory**:

   ```bash
   cd "Estate Management"
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   This installs:

   - `react@^19.2.0` - UI library
   - `react-dom@^19.2.0` - React DOM binding
   - `react-router-dom@^6.x` - Client-side routing
   - `tailwindcss@^3` - CSS framework
   - `vite@^7` - Build tool

### Development Server

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

Hot Module Replacement (HMR) is enabled, so changes save instantly without page reload.

### Build for Production

```bash
npm run build
```

Creates optimized production build in `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## 📋 Features

### Home Page (`/`)

- **Search Bar**: Search apartments by city, title, or agent name
- **Filters**:
  - Filter by State (all 37 Nigerian states)
  - Filter by max monthly rent (slider)
- **Grid Display**: Responsive grid of apartment cards
- **Results Counter**: Shows number of matching properties
- **CTA Section**: "List Property" call-to-action button

### Apartment Details Page (`/apartment/:id`)

- **Image Gallery**:
  - Main image display with navigation
  - Thumbnail carousel
  - Image counter
- **Property Info**:
  - Bedrooms, bathrooms, available units
  - Monthly rent in Nigerian Naira (₦)
  - Full address
- **Description**: Detailed property description
- **Amenities**: Grid of available amenities with checkmarks
- **Agent Contact**:
  - Agent name
  - Phone number (clickable tel link)
  - Email (clickable mailto link)
- **Inquiry Form**: Quick contact form for property inquiries

### List Property Page (`/list-property`)

- **Multi-Step Form** (3 steps):
  1. **Property Details**: Title, description, rent, location, rooms, units
  2. **Amenities & Photos**: Select from 16 amenities, upload images
  3. **Contact Info**: Agent/owner details and terms acceptance
- **Progress Indicator**: Visual step tracker
- **Form Validation**: Basic HTML5 validation
- **File Upload UI**: Drag-and-drop area for property photos
- **Summary**: Review of listing before submission

## 🎨 Design Decisions

### Why Tailwind CSS?

**Chosen**: Tailwind CSS v3

**Rationale**:

- **Utility-First**: Faster development with pre-built utility classes
- **Consistency**: Enforced design system prevents style inconsistencies
- **Small Bundle**: Tree-shaking removes unused styles
- **Scalability**: Easy to maintain styles as project grows
- **Nigerian Context**: Works perfectly for responsive, mobile-first design

### Why React Router v6?

**Chosen**: React Router v6

**Rationale**:

- **Modern API**: Component-based routing is cleaner
- **Nested Routes**: Ready for feature expansion
- **Built-in Hooks**: useParams, useNavigate for routing logic
- **Code Splitting**: Ready for lazy loading in production

### State Management

**Approach**: React Hooks (useState, useMemo)

**Rationale for MVP**:

- No external state library complexity needed yet
- `useMemo` optimizes filter performance
- Easy migration path to Redux/Zustand when needed
- Matches MVP requirements (local state only)

## 📊 Mock Data

6 sample apartments included covering:

- **Lagos**: Ikoyi (luxury), Victoria Island, Surulere (affordable), Lekki, Yaba
- **FCT**: Abuja CBD

Each includes:

- Realistic Nigerian addresses and prices (₦120k - ₦1.2M/month)
- Agent contact info
- 1-4 bedrooms
- Multiple amenities
- High-quality placeholder images

Access at: `src/data/mockData.ts`

## 🔧 Component API

### ApartmentCard

```tsx
<ApartmentCard apartment={apartmentObject} />
```

- **Props**: `apartment` (Apartment type from apartment.ts)
- **Features**: Hover effects, responsive layout, currency formatting

### Button

```tsx
<Button variant="primary|secondary|danger" onClick={handler}>
  Click me
</Button>
```

- **Variants**: primary (blue), secondary (gray), danger (red)
- **Props**: type, disabled, className

### Header & Footer

- **Header**: Sticky navigation with logo and CTA
- **Footer**: Multi-column footer with company info and links

## 🔄 Routing Structure

```
/                          → Home (listings with search/filter)
/apartment/:id            → Apartment details page
/list-property            → Multi-step property listing form
```

## 🚀 Future Enhancements (Beyond MVP)

- [ ] Backend API integration (Node.js, Python, etc.)
- [ ] User authentication (login, profile)
- [ ] Payment processing for premium listings
- [ ] User reviews and ratings
- [ ] Saved favorites/wishlist
- [ ] Advanced search filters (amenities, price ranges)
- [ ] Email notifications for new listings
- [ ] Admin dashboard for property verification
- [ ] Real image upload to cloud storage
- [ ] SMS/WhatsApp integration for agent contact
- [ ] Map integration (Google Maps, Mapbox)
- [ ] Mobile app (React Native)

## 💡 Key Implementation Details

### TypeScript Benefits

- **Type Safety**: Prevents runtime errors with apartment data
- **IntelliSense**: Better IDE autocomplete
- **Self-Documentation**: Types serve as inline documentation

### Responsive Design

- Mobile-first approach with Tailwind
- Grid layouts adjust from 1→2→3 columns
- Touch-friendly buttons and inputs on mobile
- Optimized images for different screen sizes

### Performance Optimizations

- **useMemo**: Filter calculations cached to prevent unnecessary re-renders
- **React.lazy**: Ready for code splitting (future)
- **Vite**: Lightning-fast development with optimized production builds

## 🧪 Testing Components

To test routes manually:

1. **Home Page**: http://localhost:5173/
2. **First Apartment**: http://localhost:5173/apartment/1
3. **List Property**: http://localhost:5173/list-property
4. **Invalid Route**: http://localhost:5173/apartment/99 (shows "Not Found")

## 📝 Code Comments

Components include architectural decision comments explaining:

- Why specific libraries were chosen
- Component responsibilities
- Data flow patterns
- Future extension points

Example:

```tsx
/**
 * Home Page
 * Displays apartment listings with search and filter functionality
 *
 * Features:
 * - Search apartments by location or title
 * - Filter by state and price range
 * ...
 */
```

## 🐛 Troubleshooting

### Dev server not starting?

```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install
npm run dev
```

### Tailwind classes not applying?

- Ensure tailwind.config.js includes src paths
- Check postcss.config.js has tailwindcss plugin
- Restart dev server after changes to config files

### TypeScript errors?

- Run: `npm run build` to see all errors
- Check that types are imported as `type` imports
- Verify tsconfig.json is correctly set

## 📞 Support

This is an MVP frontend-only application. For production deployment:

1. Deploy to Vercel, Netlify, or GitHub Pages for free
2. Add backend API server (Django, Express, Node.js, etc.)
3. Implement proper authentication and data persistence
4. Set up email/SMS for agent notifications

## 📄 License

This project is part of a portfolio/learning exercise. Feel free to use as a reference.

---

**Built with ❤️ for the Nigerian real estate market** 🏠
