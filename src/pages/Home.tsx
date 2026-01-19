/**
 * Home Page
 * Displays apartment listings with search and filter functionality
 *
 * Features:
 * - Search apartments by location or title
 * - Filter by state and price range
 * - Display mock apartment data in responsive grid
 */

import { useState, useMemo } from "react";
import ApartmentCard from "../components/ApartmentCard";
import { mockApartments } from "../data/mockData";

export default function Home() {
  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [maxPrice, setMaxPrice] = useState(2000000);

  // Extract unique states from mock data
  const states = useMemo(() => {
    const uniqueStates = new Set(
      mockApartments.map((apt) => apt.location.state)
    );
    return Array.from(uniqueStates).sort();
  }, []);

  // Filter apartments based on search and filters
  const filteredApartments = useMemo(() => {
    return mockApartments.filter((apartment) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        apartment.title.toLowerCase().includes(searchLower) ||
        apartment.location.city.toLowerCase().includes(searchLower) ||
        apartment.location.state.toLowerCase().includes(searchLower) ||
        apartment.listedBy.name.toLowerCase().includes(searchLower);

      const matchesState =
        selectedState === "" || apartment.location.state === selectedState;
      const matchesPrice = apartment.rent <= maxPrice;

      return matchesSearch && matchesState && matchesPrice;
    });
  }, [searchTerm, selectedState, maxPrice]);

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

      {/* Search and Filter Section */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {new Intl.NumberFormat("en-NG").format(maxPrice)}
              </label>
              <input
                type="range"
                min="50000"
                max="2000000"
                step="50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {/* Results Count */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredApartments.length}{" "}
            {filteredApartments.length === 1 ? "Property" : "Properties"} Found
          </h2>
          <p className="text-gray-600">
            {searchTerm && `Showing results for "${searchTerm}"`}
          </p>
        </div>

        {/* Apartments Grid */}
        {filteredApartments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApartments.map((apartment) => (
              <ApartmentCard key={apartment.id} apartment={apartment} />
            ))}
          </div>
        ) : (
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
