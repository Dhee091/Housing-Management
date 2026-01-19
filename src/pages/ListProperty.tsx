/**
 * List Property Page
 * Form for agents and property owners to list new rental properties
 *
 * Features:
 * - Multi-step form for property details
 * - Image upload UI (mock implementation)
 * - Agent/Owner contact information
 * - Property specifications and amenities selection
 */

import { useState } from "react";
import Button from "../components/Button";

interface PropertyFormData {
  title: string;
  description: string;
  rent: string;
  state: string;
  city: string;
  address: string;
  bedrooms: string;
  bathrooms: string;
  unitsAvailable: string;
  selectedAmenities: string[];
  role: "agent" | "owner";
  name: string;
  phone: string;
  email: string;
  company?: string;
}

const AVAILABLE_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "24/7 Security",
  "Parking Space",
  "Central AC",
  "Generator Backup",
  "Furnished",
  "Internet Ready",
  "Rooftop Terrace",
  "Maid Room",
  "Hot Water System",
  "Elevator Access",
  "Garden",
  "Built-in Kitchen",
  "Concierge Service",
  "Smart Home Features",
];

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

export default function ListProperty() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    rent: "",
    state: "",
    city: "",
    address: "",
    bedrooms: "",
    bathrooms: "",
    unitsAvailable: "",
    selectedAmenities: [],
    role: "owner",
    name: "",
    phone: "",
    email: "",
    company: "",
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter((a) => a !== amenity)
        : [...prev.selectedAmenities, amenity],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In a real app, you'd upload to a server
      // For now, we'll just create preview URLs
      const newImages = Array.from(files).map((file) =>
        URL.createObjectURL(file)
      );
      setUploadedImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 3) {
      // Final submission
      console.log("Form submitted:", {
        ...formData,
        images: uploadedImages,
      });
      alert(
        "Property listed successfully! Agents will review and contact you soon."
      );
      // Reset form
      setCurrentStep(1);
      setFormData({
        title: "",
        description: "",
        rent: "",
        state: "",
        city: "",
        address: "",
        bedrooms: "",
        bathrooms: "",
        unitsAvailable: "",
        selectedAmenities: [],
        role: "owner",
        name: "",
        phone: "",
        email: "",
        company: "",
      });
      setUploadedImages([]);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            List Your Property
          </h1>
          <p className="text-gray-600 text-lg">
            Fill out the form below to list your apartment on NigiaApt
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition ${
                    step <= currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      step < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm">
            <span
              className={`font-medium ${
                currentStep === 1 ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Property Details
            </span>
            <span
              className={`font-medium ${
                currentStep === 2 ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Amenities & Photos
            </span>
            <span
              className={`font-medium ${
                currentStep === 3 ? "text-blue-600" : "text-gray-600"
              }`}
            >
              Contact Info
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Property Details */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Property Details
              </h2>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Modern 3-Bedroom in Ikoyi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the property, its features, and unique selling points"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Rent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (₦) *
                </label>
                <input
                  type="number"
                  name="rent"
                  value={formData.rent}
                  onChange={handleInputChange}
                  placeholder="e.g., 500000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select State</option>
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Lagos"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g., 45 Banana Island Road, Ikoyi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Rooms and Units */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms *
                  </label>
                  <select
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select</option>
                    <option value="0">Studio</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms *
                  </label>
                  <select
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  >
                    <option value="">Select</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Units Available *
                  </label>
                  <input
                    type="number"
                    name="unitsAvailable"
                    value={formData.unitsAvailable}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Amenities & Photos */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Amenities & Photos
              </h2>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Amenities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AVAILABLE_AMENITIES.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedAmenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="ml-2 text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Property Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-gray-700 font-medium mb-1">
                      Click to upload or drag images
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB (at least 1 image recommended)
                    </p>
                  </label>
                </div>

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Uploaded Images ({uploadedImages.length})
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          className="relative group overflow-hidden rounded-lg"
                        >
                          <img
                            src={image}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            <span className="text-white font-bold text-2xl">
                              ✕
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Contact Information
              </h2>

              {/* Listing Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I am listing as a *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="owner"
                      checked={formData.role === "owner"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Property Owner</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="role"
                      value="agent"
                      checked={formData.role === "agent"}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-gray-700">Real Estate Agent</span>
                  </label>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Company (only for agents) */}
              {formData.role === "agent" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company || ""}
                    onChange={handleInputChange}
                    placeholder="Your real estate company"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+234 800 123 4567"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.ng"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Terms and Conditions */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                    defaultChecked
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the terms and conditions and understand that
                    NigiaApt will review my property listing.
                  </span>
                </label>
              </div>

              {/* Summary */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-bold text-gray-900 mb-4">
                  Listing Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Title:</span>{" "}
                    <span className="font-medium">
                      {formData.title || "Not provided"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Location:</span>{" "}
                    <span className="font-medium">
                      {formData.city}, {formData.state}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Monthly Rent:</span>{" "}
                    <span className="font-medium">₦{formData.rent}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Images:</span>{" "}
                    <span className="font-medium">
                      {uploadedImages.length} uploaded
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1"
              >
                ← Back
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              className={currentStep < 3 ? "flex-1" : "flex-1"}
            >
              {currentStep === 3 ? "✓ Submit Listing" : "Next →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
