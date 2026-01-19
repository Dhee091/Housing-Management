/**
 * ApartmentDetails Page
 * Displays full apartment information including images, description, and agent contact
 *
 * Features:
 * - Image carousel/gallery
 * - Full apartment details and amenities
 * - Agent contact information
 * - Inquiry form (basic)
 */

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { mockApartments } from "../data/mockData";
import Button from "../components/Button";

export default function ApartmentDetails() {
  const { id } = useParams<{ id: string }>();
  const apartment = mockApartments.find((apt) => apt.id === id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showInquiryForm, setShowInquiryForm] = useState(false);

  if (!apartment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
        <p className="text-gray-600 mb-6">
          The apartment you're looking for doesn't exist.
        </p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Listings
        </Link>
      </div>
    );
  }

  // Format rent with Nigerian Naira
  const formattedRent = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(apartment.rent);

  const handlePreviousImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + apartment.images.length) % apartment.images.length
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % apartment.images.length);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-700 font-medium mb-6 inline-flex items-center"
        >
          ← Back to Listings
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="mb-8">
              <div
                className="relative bg-gray-900 rounded-lg overflow-hidden mb-4"
                style={{ height: "500px" }}
              >
                <img
                  src={apartment.images[selectedImageIndex]}
                  alt={`${apartment.title} - Image ${selectedImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Buttons */}
                {apartment.images.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition"
                    >
                      ❮
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition"
                    >
                      ❯
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {apartment.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                    {selectedImageIndex + 1} / {apartment.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {apartment.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {apartment.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition ${
                        index === selectedImageIndex
                          ? "border-blue-600"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Title and Overview */}
            <div className="bg-white rounded-lg p-6 mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {apartment.title}
              </h1>
              <p className="text-gray-600 mb-4 text-lg">
                📍 {apartment.location.address}, {apartment.location.city},{" "}
                {apartment.location.state}
              </p>

              {/* Key Details */}
              <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                <div>
                  <p className="text-gray-600 text-sm">Bedrooms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {apartment.bedrooms === 0 ? "Studio" : apartment.bedrooms}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Bathrooms</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {apartment.bathrooms}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Units Available</p>
                  <p className="text-2xl font-bold text-green-600">
                    {apartment.unitsAvailable}
                  </p>
                </div>
              </div>

              {/* Monthly Rent */}
              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-1">Monthly Rent</p>
                <p className="text-4xl font-bold text-blue-600">
                  {formattedRent}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About This Property
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {apartment.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {apartment.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-blue-600 mr-3">✓</span>
                    <span className="text-gray-800">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Inquiry */}
          <div className="lg:col-span-1">
            {/* Contact Card */}
            <div className="bg-white rounded-lg p-6 sticky top-24 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {apartment.listedBy.role === "agent"
                  ? "Agent Information"
                  : "Owner Information"}
              </h3>

              {/* Listing Role Badge */}
              <div className="mb-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    apartment.listedBy.role === "agent"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {apartment.listedBy.role === "agent"
                    ? "Professional Agent"
                    : "Owner Listing"}
                </span>
              </div>

              {/* Contact Details */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <p className="text-gray-600 text-sm mb-1">Listed By</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {apartment.listedBy.name}
                </p>
                {apartment.listedBy.company && (
                  <p className="text-sm text-gray-600 mb-4">
                    {apartment.listedBy.company}
                  </p>
                )}

                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Phone</p>
                    <a
                      href={`tel:${apartment.listedBy.phone}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-lg"
                    >
                      {apartment.listedBy.phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Email</p>
                    <a
                      href={`mailto:${apartment.listedBy.email}`}
                      className="text-blue-600 hover:text-blue-700 font-medium break-all"
                    >
                      {apartment.listedBy.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button variant="primary" className="w-full">
                  📱 Call Agent
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowInquiryForm(!showInquiryForm)}
                  className="w-full"
                >
                  ✉️ Send Inquiry
                </Button>
              </div>
            </div>

            {/* Inquiry Form */}
            {showInquiryForm && (
              <div className="bg-white rounded-lg p-6 mt-4 border-2 border-blue-600">
                <h4 className="font-bold text-gray-900 mb-4">Quick Inquiry</h4>
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    alert(
                      "Thank you for your inquiry! The agent will contact you soon."
                    );
                    setShowInquiryForm(false);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <Button type="submit" variant="primary" className="w-full">
                    Submit Inquiry
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Related Listings Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Similar Properties
          </h2>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse More Properties →
          </Link>
        </div>
      </div>
    </div>
  );
}
