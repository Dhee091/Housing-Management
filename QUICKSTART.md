# QUICK START GUIDE - 5 Minutes to Running App

## One-Time Setup (2 minutes)

### Step 1: Install Node Modules

```bash
npm install
```

**What it does**: Downloads all dependencies (React, Tailwind, Router, etc.)

**Output**: You'll see a list of packages installed. Should end with "0 vulnerabilities"

### Step 2: Start Development Server

```bash
npm run dev
```

**What it does**: Starts local dev server with hot reload

**Output**:

```
  VITE v7.3.1  ready in 324 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

Click the link or open http://localhost:5173/ in your browser.

## App is Now Running! 🎉

### What You See on Home Page

- Header with NigiaApt logo and "List Property" button
- Search bar for finding apartments
- State filter dropdown (Lagos, FCT, etc.)
- Price slider (₦50k - ₦2M)
- Grid of 6 sample apartment cards
- Each card shows image, price, location, units available

### Try These Actions

#### 1. Search by City

- Type "Lagos" in search box → See Lagos apartments only
- Type "Victoria" → See Victoria Island apartment only

#### 2. Filter by State

- Select "Lagos" from dropdown → See only Lagos apartments
- Select "FCT" → See only Abuja apartments
- Select "All States" → See all apartments

#### 3. Filter by Price

- Drag slider left → Only cheap apartments
- Drag slider right → Only expensive apartments
- Combine with search filters

#### 4. View Apartment Details

- Click any apartment card → Detailed view opens
- See full description, all amenities, agent contact
- Use arrow buttons to browse images
- Try the "Send Inquiry" form (it's a mock)

#### 5. List a Property

- Click "List Property" button in header (top right)
- **Step 1**: Enter property details (title, rent, location, rooms)
- **Step 2**: Select amenities, upload fake images (just select files, doesn't actually upload)
- **Step 3**: Enter agent/owner contact info
- Click "Submit Listing" → Success message appears

## Folder & File Guide

### What Each Folder Does

```
src/
├── components/
│   ├── Header.tsx      → Navigation bar at top
│   ├── Footer.tsx      → Footer at bottom
│   ├── ApartmentCard.tsx → One apartment in grid
│   └── Button.tsx      → Reusable button
│
├── pages/
│   ├── Home.tsx        → Main listing page with filters
│   ├── ApartmentDetails.tsx → Single apartment page
│   └── ListProperty.tsx → Form to list property
│
├── types/
│   └── apartment.ts    → Data structure definitions
│
├── data/
│   └── mockData.ts     → 6 fake apartments
│
├── App.tsx             → Routes + layout
├── main.tsx            → Entry point
└── index.css           → Tailwind + global styles
```

### Where to Find Sample Data

Open `src/data/mockData.ts` to see the 6 apartments:

- Modern 3-Bedroom in Ikoyi (₦500k/month)
- Luxury 2-Bedroom in VI (₦750k/month)
- Affordable 1-Bedroom in Surulere (₦200k/month)
- Contemporary 4-Bedroom in Lekki (₦1.2M/month)
- Cozy Studio in Yaba (₦120k/month)
- Premium 2-Bedroom in Abuja CBD (₦600k/month)

## Making Your First Change

### Add a New Apartment

1. Open `src/data/mockData.ts`
2. Find the `mockApartments` array
3. Add new object at the end:

```tsx
{
  id: '7',
  title: 'Your New Apartment',
  description: 'A great place to live',
  rent: 350000,
  location: {
    state: 'Lagos',
    city: 'Ikeja',
    address: '123 Your Street'
  },
  images: ['https://images.unsplash.com/...'],
  unitsAvailable: 2,
  bedrooms: 2,
  bathrooms: 1,
  amenities: ['WiFi', 'Security'],
  agentName: 'Your Name',
  agentPhone: '+234 800 000 0000',
  agentEmail: 'you@example.com',
  createdAt: '2026-01-20T10:00:00Z',
}
```

4. Save file
5. App auto-refreshes, new apartment appears in grid!

### Change a Color

1. Open `src/index.css`
2. Find `.btn-primary` section
3. Change `bg-blue-600` to another Tailwind color:
   - `bg-green-600` for green
   - `bg-red-600` for red
   - `bg-purple-600` for purple
4. Save → buttons change color instantly!

### Update Mock Prices

Open `src/data/mockData.ts` and change any `rent:` value. Changes appear immediately.

## Common Issues & Fixes

### "Port 5173 already in use"

```bash
# Kill other process using port 5173
# Or change port in vite.config.ts
```

### Styles not updating

```bash
# Hard refresh browser
Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### Changes not appearing

```bash
# Make sure dev server is running
npm run dev

# If it says there are errors, check the terminal
# Fix any red errors, file saves auto-reload
```

### "Cannot find module" error

```bash
# Reinstall dependencies
npm install

# Clear node_modules cache
npm cache clean --force
npm install
```

## Next Steps After MVP

### To Add a Backend

1. Create a Node.js/Django/Flask server
2. Create `/api/apartments` endpoint
3. Replace `mockData.ts` with API calls
4. Add user authentication
5. Add database

### To Add Features

- [ ] User login/signup
- [ ] Save favorites
- [ ] Email notifications
- [ ] Payment processing
- [ ] Property reviews
- [ ] Map integration
- [ ] Mobile app

### To Deploy to Production

```bash
# Build for production
npm run build

# Test production build
npm run preview

# Deploy dist/ folder to:
# - Vercel.com (recommended - free)
# - Netlify.com (free)
# - GitHub Pages (free)
```

## File Structure Explained

### Why this structure?

```
/components  → Reusable pieces (buttons, cards, header)
/pages       → Full pages (Home, Details, ListProperty)
/types       → Data shapes (what is an Apartment?)
/data        → Sample data (6 fake apartments)
```

### Adding a new page?

1. Create file in `/pages/MyNewPage.tsx`
2. Add route in `/App.tsx`:

```tsx
<Route path="/mynewpage" element={<MyNewPage />} />
```

3. Link to it from Header or other pages

### Adding a reusable component?

1. Create file in `/components/MyComponent.tsx`
2. Import and use in pages:

```tsx
import MyComponent from "@/components/MyComponent";
<MyComponent prop="value" />;
```

## Development Tips

### Use Browser DevTools

- F12 to open (Chrome/Edge) or Option+Cmd+I (Safari)
- Elements tab: inspect HTML/CSS
- Console tab: see any JavaScript errors
- Network tab: see API calls (future)

### Check TypeScript Errors

```bash
npm run build
# This shows ALL TypeScript errors before deploying
```

### Lint Code

```bash
npm run lint
# Shows code style issues
```

## Keyboard Shortcuts

While dev server running:

- `h` + Enter → Show Vite help
- `r` → Force reload page
- `q` → Quit dev server
- `Ctrl+C` → Stop dev server

## File Format Guide

### .tsx Files

- React components with TypeScript
- **TSX** = TypeScript + JSX

### .ts Files

- Pure TypeScript (no JSX)
- Types, interfaces, utility functions

### .css Files

- Styles with Tailwind @directives
- Global styles and custom components

### .json Files

- Configuration files (read-only)
- package.json, tsconfig.json, vite.config.ts

## What's Pre-configured

✅ React 19 + TypeScript  
✅ Vite build tool  
✅ Tailwind CSS v3  
✅ React Router v6  
✅ ESLint (code quality)  
✅ Hot Module Reload  
✅ Path alias `@` → `src/`

## Questions?

Check these files:

- **Setup questions** → `SETUP_GUIDE.md`
- **Architecture questions** → `ARCHITECTURE.md`
- **Deployment questions** → `SETUP_GUIDE.md` (bottom section)

---

**You're all set! Happy coding! 🚀**
