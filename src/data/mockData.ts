/**
 * Mock data for Nigerian apartment listings
 * This serves as the initial dataset for the MVP
 * In production, this would be replaced with real backend API calls
 */

import type { Apartment } from "../types/apartment";

export const mockApartments: Apartment[] = [
  {
    id: "1",
    title: "Modern 3-Bedroom Apartment in Ikoyi",
    description:
      "Stunning modern apartment with premium finishes, spacious living areas, and excellent natural lighting. Built-in wardrobes, modern kitchen with quality appliances. Safe, gated community with 24/7 security.",
    rent: 500000,
    location: {
      state: "Lagos",
      city: "Ikoyi",
      address: "45 Banana Island Road, Ikoyi",
    },
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1545324418-cc1a9d6fdf60?w=500&h=400&fit=crop",
    ],
    unitsAvailable: 2,
    bedrooms: 3,
    bathrooms: 2,
    amenities: [
      "Swimming Pool",
      "24/7 Security",
      "Gym",
      "Parking Space",
      "Central AC",
      "Generator Backup",
    ],
    listedBy: {
      id: "agent-1",
      name: "Chioma Okonkwo",
      role: "agent",
      phone: "+234 803 456 7890",
      email: "chioma@estateagents.ng",
      company: "Elite Properties",
    },
    createdAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "2",
    title: "Luxury 2-Bedroom in Victoria Island",
    description:
      "Exquisite 2-bedroom apartment in the heart of Victoria Island. Premium location near restaurants, shopping, and entertainment. Fully furnished with high-end furniture and appliances.",
    rent: 750000,
    location: {
      state: "Lagos",
      city: "Victoria Island",
      address: "12 Admiralty Way, VI",
    },
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=400&fit=crop",
    ],
    unitsAvailable: 1,
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      "Furnished",
      "Concierge Service",
      "Rooftop Terrace",
      "Smart Home Features",
      "Elevator Access",
    ],
    listedBy: {
      id: "agent-2",
      name: "Uche Adeyemi",
      role: "agent",
      phone: "+234 805 789 1234",
      email: "uche@estateagents.ng",
      company: "Premium Realty Solutions",
    },
    createdAt: "2026-01-12T14:15:00Z",
  },
  {
    id: "3",
    title: "Affordable 1-Bedroom in Surulere",
    description:
      "Comfortable 1-bedroom apartment suitable for young professionals. Good location with easy access to public transportation, markets, and schools. Well-maintained building with friendly neighbors.",
    rent: 200000,
    location: {
      state: "Lagos",
      city: "Surulere",
      address: "78 Shogunle Road, Surulere",
    },
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500&h=400&fit=crop",
    ],
    unitsAvailable: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [
      "Water Supply",
      "Electricity",
      "Secure Building",
      "Close to Schools",
      "Bus Stop Nearby",
    ],
    listedBy: {
      id: "owner-1",
      name: "Folake Adeleke",
      role: "owner",
      phone: "+234 902 345 6789",
      email: "folake.adeleke@gmail.com",
    },
    createdAt: "2026-01-10T09:45:00Z",
  },
  {
    id: "4",
    title: "Contemporary 4-Bedroom in Lekki",
    description:
      "Spacious 4-bedroom contemporary apartment in upscale Lekki neighborhood. Features open-plan living, modern kitchen, and multiple living areas. Perfect for families or corporate housing.",
    rent: 1200000,
    location: {
      state: "Lagos",
      city: "Lekki",
      address: "234 Lekki Conservation Road, Lekki Phase 1",
    },
    images: [
      "https://images.unsplash.com/photo-1505873242700-f289a29e7e0f?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1522159650410-77015b35b091?w=500&h=400&fit=crop",
    ],
    unitsAvailable: 1,
    bedrooms: 4,
    bathrooms: 3,
    amenities: [
      "Swimming Pool",
      "Garden",
      "Gym",
      "Security Gate",
      "Maid Room",
      "Large Parking",
    ],
    listedBy: {
      id: "agent-3",
      name: "Segun Okafor",
      role: "agent",
      phone: "+234 808 123 4567",
      email: "segun@oakforproperties.ng",
      company: "Oakfor Properties",
    },
    createdAt: "2026-01-18T11:20:00Z",
  },
  {
    id: "5",
    title: "Cozy Studio in Yaba",
    description:
      "Perfect starter apartment - a well-designed studio in vibrant Yaba. Walking distance to universities, cafes, and entertainment venues. Ideal for students or young professionals.",
    rent: 120000,
    location: {
      state: "Lagos",
      city: "Yaba",
      address: "56 Awolowo Road, Yaba",
    },
    images: [
      "https://images.unsplash.com/photo-1516455207990-7a41e1a267c9?w=500&h=400&fit=crop",
    ],
    unitsAvailable: 4,
    bedrooms: 0,
    bathrooms: 1,
    amenities: [
      "Internet Ready",
      "Tiled Floor",
      "Built-in Kitchen",
      "Modern Bathroom",
    ],
    listedBy: {
      id: "owner-2",
      name: "Tunde Alabi",
      role: "owner",
      phone: "+234 901 234 5678",
      email: "tunde.properties@gmail.com",
    },
    createdAt: "2026-01-17T15:50:00Z",
  },
  {
    id: "6",
    title: "Premium 2-Bedroom in Abuja - Central Business District",
    description:
      "Executive 2-bedroom apartment in Abuja CBD. Close to offices, restaurants, and shopping centers. Modern amenities, reliable utilities, and professional management.",
    rent: 600000,
    location: {
      state: "FCT",
      city: "Abuja",
      address: "89 Herbert Macaulay Way, CBD",
    },
    images: [
      "https://images.unsplash.com/photo-1570129477492-45a003537e1f?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=400&fit=crop",
    ],
    unitsAvailable: 2,
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      "Central AC",
      "Hot Water System",
      "Backup Generator",
      "Parking",
      "Security",
    ],
    listedBy: {
      id: "agent-4",
      name: "Ngozi Obi",
      role: "agent",
      phone: "+234 906 789 0123",
      email: "ngozi@abuja-estates.ng",
      company: "Abuja Estates Limited",
    },
    createdAt: "2026-01-19T13:25:00Z",
  },
];
