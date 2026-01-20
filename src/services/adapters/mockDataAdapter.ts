/**
 * Mock Data Adapter
 *
 * Converts the existing mockData structure to the new domain models.
 * This bridges the gap between legacy mock data and the new service layer.
 *
 * In production, this is removed and data comes directly from the backend.
 */

import type { ApartmentListing } from "../../models/domain";
import { mockApartments } from "../../data/mockData";

/**
 * Convert legacy mockApartments to domain model format
 * The mockData is already in the correct format, so this is a pass-through
 * In a real migration scenario, this would do more substantial transformation
 */
export function convertMockDataToDomain(): ApartmentListing[] {
  return mockApartments.map((apt: any) => {
    // mockApartments already follow the domain model structure
    // This function is here for documentation and future flexibility
    return apt as ApartmentListing;
  });
}

/**
 * Example: How to adapt from a different data structure
 *
 * If your legacy backend returned:
 * {
 *   apartmentId: "123",
 *   propertyName: "3-Bed in Ikoyi",
 *   monthlyPrice: 500000,
 *   ...
 * }
 *
 * You'd transform it like:
 *
 * export function convertMockDataToDomain(): ApartmentListing[] {
 *   return legacyData.map((apt) => ({
 *     id: apt.apartmentId,
 *     title: apt.propertyName,
 *     price: apt.monthlyPrice,
 *     // ... other mappings
 *   }));
 * }
 *
 * Once migrated to the new backend with proper domain models,
 * this adapter is no longer needed.
 */
