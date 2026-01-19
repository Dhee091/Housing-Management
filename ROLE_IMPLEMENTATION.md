# Agent vs Owner Role Implementation

## Overview

This document outlines the implementation of agent vs owner roles in the NigiaApt real estate listing platform. Users can now list properties either as professional real estate agents or as individual property owners.

## Changes Made

### 1. **Type System Updates** (`src/types/apartment.ts`)

#### New Types:

- **`UserRole`**: Union type with values `"agent"` | `"owner"`
- **`User`**: Interface for user profiles with:
  - `id`: Unique identifier
  - `name`: Full name
  - `role`: UserRole ("agent" or "owner")
  - `phone`: Contact phone number
  - `email`: Contact email
  - `company?`: Optional company name (for agents)

#### Modified Structures:

- **`Apartment.listedBy`**: Replaced flat agent contact fields with nested User object

  - Old structure: `agentName`, `agentPhone`, `agentEmail` (flat fields)
  - New structure: `listedBy: User` (nested object with role information)

- **`ListingFormData`**: Updated to reflect new structure
  - Changed from: `agentName`, `agentPhone`, `agentEmail`
  - Changed to: `role`, `name`, `phone`, `email`, `company?`

### 2. **Mock Data Migration** (`src/data/mockData.ts`)

All 6 apartments updated with new `listedBy` structure:

| Apartment ID | Lister Name    | Role  | Company                  |
| ------------ | -------------- | ----- | ------------------------ |
| 1            | Chioma Okonkwo | agent | Elite Properties         |
| 2            | Uche Adeyemi   | agent | Premium Realty Solutions |
| 3            | Folake Adeleke | owner | (none)                   |
| 4            | Segun Okafor   | agent | Oakfor Properties        |
| 5            | Tunde Alabi    | owner | (none)                   |
| 6            | Ngozi Obi      | agent | Abuja Estates Limited    |

### 3. **Component Updates**

#### ApartmentCard (`src/components/ApartmentCard.tsx`)

- Added role badge in top-left corner of image
- Blue badge for agents, green badge for owners
- Badge clearly shows listing type: "Agent" or "Owner"

#### ApartmentDetails (`src/pages/ApartmentDetails.tsx`)

- Updated contact card header to show "Agent Information" or "Owner Information"
- Added role badge showing "Professional Agent" or "Owner Listing"
- Company name displayed for agent listings only
- All contact fields reference `apartment.listedBy.*` properties

### 4. **ListProperty Form (`src/pages/ListProperty.tsx`)**

#### Step 3: Contact Information - New Features

- **Role Selection**: Radio buttons for "Property Owner" or "Real Estate Agent"
- **Conditional Fields**:
  - Company name field shown ONLY for agents
  - Standard for both: Name, Phone, Email
- **Form Data Structure**: Updated to store role and optional company information

### 5. **Search & Filtering (`src/pages/Home.tsx`)**

- Updated search to use `apartment.listedBy.name` instead of `apartment.agentName`
- Search placeholder updated to "Search by city, title, or lister name..."
- Filtering logic maintains compatibility with new data structure

## Visual Indicators

### Role Badges

- **Agent Listing**: Blue badge with white text "Agent"
- **Owner Listing**: Green badge with white text "Owner"

Badges appear in:

1. **ApartmentCard**: Top-left of property image
2. **ApartmentDetails**: In the contact information card

### Contact Card Headers

- **Agents**: "Agent Information" + "Professional Agent" status badge + Company name
- **Owners**: "Owner Information" + "Owner Listing" status badge + No company field

## User Flow Examples

### For Property Owners

1. Navigate to "List Property"
2. Fill property details, amenities, and photos
3. In Step 3, select "Property Owner" role
4. Provide personal contact information (Name, Phone, Email)
5. Submit listing - appears with green "Owner" badge

### For Real Estate Agents

1. Navigate to "List Property"
2. Fill property details, amenities, and photos
3. In Step 3, select "Real Estate Agent" role
4. Company name field automatically appears
5. Provide agent contact information with company details
6. Submit listing - appears with blue "Agent" badge and company affiliation

## Technical Benefits

### Data Integrity

- Clear type safety with `UserRole` union type
- Structured contact information prevents errors
- Optional company field prevents confusion for owner listings

### User Experience

- Role-specific UI elements reduce complexity
- Clear visual distinction between agent and owner listings
- Company affiliation provides credibility for professional listings

### Extensibility

- Role system easily extended to support other user types (e.g., "developer", "agency")
- User interface and badge system scales to new roles
- Contact card can be customized per role

## Future Enhancements

1. **User Authentication**: Store role in user profiles
2. **Profile Pages**: Show all listings by agent/owner
3. **Verification**: Badge system for verified agents
4. **Ratings**: Separate rating systems for agents vs owners
5. **Direct Messaging**: Role-aware messaging system
6. **Analytics**: Track listings by role type

## Code Examples

### Accessing Lister Information

```typescript
// Old approach (no longer valid)
apartment.agentName; // ❌ Property doesn't exist

// New approach
apartment.listedBy.name; // ✅ Correct
apartment.listedBy.role; // Returns: "agent" | "owner"
apartment.listedBy.company; // Optional, only for agents
```

### Conditional Rendering by Role

```typescript
{
  apartment.listedBy.role === "agent" ? (
    <>
      <h3>Agent Information</h3>
      <p>Company: {apartment.listedBy.company}</p>
    </>
  ) : (
    <>
      <h3>Owner Information</h3>
      <p>(No company affiliation)</p>
    </>
  );
}
```

## Files Modified Summary

| File                               | Changes                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| `src/types/apartment.ts`           | Added UserRole type, User interface, restructured Apartment.listedBy |
| `src/data/mockData.ts`             | Migrated all 6 apartments to new listedBy structure                  |
| `src/components/ApartmentCard.tsx` | Added role badge display                                             |
| `src/pages/ApartmentDetails.tsx`   | Updated contact card with role info and company name                 |
| `src/pages/ListProperty.tsx`       | Added role selection and conditional company field                   |
| `src/pages/Home.tsx`               | Updated search to use listedBy.name                                  |

## Testing Checklist

- [x] All TypeScript compilation errors resolved
- [x] Mock data properly formatted with new structure
- [x] ApartmentCard displays correct role badge (agent/owner)
- [x] ApartmentDetails shows appropriate contact card based on role
- [x] ListProperty form shows/hides company field based on role selection
- [x] Search functionality works with new data structure
- [x] All routes navigate correctly
- [x] Dev server builds without errors

## Status

✅ **Complete** - Agent vs Owner role system fully implemented with:

- Type-safe data structures
- UI components showing role distinctions
- Form workflow with role selection
- Visual badges for easy identification
- Search and filtering fully functional
