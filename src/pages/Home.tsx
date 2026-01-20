/**
 * Home Page
 * Displays apartment listings with search and filter functionality
 *
 * Architecture:
 * - Uses listingService (backend-agnostic) instead of direct mockData import
 * - All data access goes through the service layer
 * - No direct dependencies on Firebase, Supabase, or any backend SDK
 * - Swapping backends requires changes only in /services, not here
 *
 * Features:
 * - Search apartments by location or title
 * - Filter by state, price, and units available
 * - Display listings in responsive grid
 * - Results update in real-time with filters
 */

import { useState, useEffect } from "react";
import ApartmentCard from "../components/ApartmentCard";
import { useListingService } from "../hooks/useListingService";
import type { ApartmentListing } from "../models/domain";

export default function Home() {
  // Service initialization
  const {
    service,
    loading: serviceLoading,
    error: serviceError,
  } = useListingService();

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [maxRent, setMaxRent] = useState(2000000);
  const [minUnitsAvailable, setMinUnitsAvailable] = useState(1);

  // State for listings and pagination
  const [listings, setListings] = useState<ApartmentListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);

  // Fetch states for the filter dropdown
  useEffect(() => {
    if (!service) return;

    const fetchStates = async () => {
      try {
        // Get all listings (no filters) to extract unique states
        const result = await service.getListings({ pageSize: 1000 });
        const uniqueStates = new Set(
          result.items.map((apt) => apt.location.state)
        );
        setStates(Array.from(uniqueStates).sort());
      } catch (err) {
        console.error("Failed to fetch states:", err);
      }
    };

    fetchStates();
  }, [service]);

  // Fetch listings whenever filters change
  useEffect(() => {
    if (!service) return;

    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await service.getListings({
          searchTerm: searchTerm || undefined,
          state: selectedState || undefined,
          maxRent,
          minUnitsAvailable,
          page: 1,
          pageSize: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        setListings(result.items);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch listings";
        setError(message);
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [service, searchTerm, selectedState, maxRent, minUnitsAvailable]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Perfect Apartment in Nigeria
          </h1>
          <p className="text-xl opacity-90">
            Browse and discover quality rental apartments across major Nigerian
            cities
          </p>
        </div>
      </section>

      {/* Service Loading/Error State */}
      {serviceLoading && (
        <div className="bg-white py-8 text-center">
          <p className="text-gray-600">Loading service...</p>
        </div>
      )}

      {serviceError && (
        <div className="bg-red-50 py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-red-700">
              Error initializing service: {serviceError.message}
            </p>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      {!serviceLoading && (
        <section className="bg-white py-8 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by city, title, or lister name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* State Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Monthly Rent: ₦
                  {new Intl.NumberFormat("en-NG").format(maxRent)}
                </label>
                <input
                  type="range"
                  min="50000"
                  max="2000000"
                  step="50000"
                  value={maxRent}
                  onChange={(e) => setMaxRent(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Units Available Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Units Available: {minUnitsAvailable}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={minUnitsAvailable}
                  onChange={(e) => setMinUnitsAvailable(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Results Count */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {listings.length}{" "}
            {listings.length === 1 ? "Property" : "Properties"} Found
          </h2>
          <p className="text-gray-600">
            {searchTerm && `Showing results for "${searchTerm}"`}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">Loading listings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 p-4 rounded-lg text-red-700">
            Error loading listings: {error}
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !error && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((apartment) => (
              <ApartmentCard key={apartment.id} apartment={apartment} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && listings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No properties found</p>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-blue-50 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Want to List Your Property?
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            Reach thousands of tenants looking for quality apartments
          </p>
          <a
            href="/list-property"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            List Your Property Now
          </a>
        </div>
      </section>
    </div>
  );
}
