/**
 * Core TypeScript interfaces for the real estate application
 * These interfaces define the structure of apartments and related data
 */

/**
 * User roles in the application
 * - agent: Professional real estate agent with access to managed properties
 * - owner: Property owner managing their own listings
 */
export type UserRole = "agent" | "owner";

/**
 * User account information
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  company?: string; // For agents only
  createdAt: string;
}

/**
 * Main apartment/property listing
 */
export interface Apartment {
  id: string;
  title: string;
  description: string;
  rent: number; // Amount in Naira (₦)
  location: {
    state: string;
    city: string;
    address: string;
  };
  images: string[]; // Array of image URLs
  unitsAvailable: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  // Listing provider info
  listedBy: {
    id: string;
    name: string;
    role: UserRole; // 'agent' or 'owner'
    phone: string;
    email: string;
    company?: string; // For agents
  };
  createdAt: string; // ISO date string
  updatedAt?: string;
}

/**
 * Form data for creating/editing a listing
 * Unified for both agents and owners
 */
export interface ListingFormData {
  title: string;
  description: string;
  rent: number;
  state: string;
  city: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  unitsAvailable: number;
  amenities: string[];
  // Provider info - different fields based on role
  name: string; // Owner name or agent name
  email: string;
  phone: string;
  role: UserRole; // 'agent' or 'owner'
  company?: string; // Optional, for agents only
  images: File[];
}
