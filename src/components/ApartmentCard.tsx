/**
 * ApartmentCard component
 * Reusable card component displaying apartment listing summary
 *
 * Props:
 * - apartment: Apartment object containing all property details
 * - onView: Optional callback when user clicks the card
 */

import { Link } from "react-router-dom";
import type { Apartment } from "../types/apartment";

interface ApartmentCardProps {
  apartment: Apartment;
}

export default function ApartmentCard({ apartment }: ApartmentCardProps) {
  // Format rent with Nigerian Naira symbol
  const formattedRent = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(apartment.rent);

  return (
    <Link to={`/apartment/${apartment.id}`} className="block h-full">
      <div className="card p-0 overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow duration-300">
        {/* Image Container */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <img
            src={apartment.images[0]}
            alt={apartment.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {/* Units Available Badge */}
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {apartment.unitsAvailable} units
          </div>
          {/* Listing Type Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                apartment.listedBy.role === "agent"
                  ? "bg-blue-500 text-white"
                  : "bg-green-600 text-white"
              }`}
            >
              {apartment.listedBy.role === "agent" ? "Agent" : "Owner"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
            {apartment.title}
          </h3>

          {/* Location */}
          <p className="text-sm text-gray-600 mb-3">
            📍 {apartment.location.city}, {apartment.location.state}
          </p>

          {/* Description (truncated) */}
          <p className="text-sm text-gray-700 mb-4 line-clamp-2 flex-grow">
            {apartment.description}
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
            <div>
              <p className="text-gray-600">Bedrooms</p>
              <p className="font-semibold text-gray-900">
                {apartment.bedrooms || "Studio"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Bathrooms</p>
              <p className="font-semibold text-gray-900">
                {apartment.bathrooms}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Rent/Month</p>
              <p className="font-semibold text-blue-600 text-xs">
                {formattedRent}
              </p>
            </div>
          </div>

          {/* Rent Amount (Large) */}
          <div className="border-t pt-4">
            <p className="text-2xl font-bold text-blue-600">{formattedRent}</p>
            <p className="text-xs text-gray-500">per month</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-4 pb-4">
          <button className="w-full btn-primary">View Details →</button>
        </div>
      </div>
    </Link>
  );
}
