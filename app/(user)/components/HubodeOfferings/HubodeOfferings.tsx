'use client'; // Mark as a Client Component is essential here!

import React, { useState, useEffect } from 'react';
import './hfo.scss'; // Adjust path to your SCSS file if needed
import SectionTitle from '../SectionTitle/SectionTitle'; // Adjust path to SectionTitle if needed

// --- Sanity Imports ---
// Adjust this path based on where your client.ts file is located!
// Assuming your client setup is in '@/sanity/lib/client'
import { client, urlFor } from '@/sanity/lib/client';
import { groq } from 'next-sanity';
// Import the Sanity Image type for TypeScript
import type { Image as SanityImage } from 'sanity';

export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds

// --- TypeScript type for the fetched data ---
// Added _createdAt for clarity, though not strictly needed for the query logic itself
interface HubodeAmenity {
  _id: string;
  _type: 'hubodeAmenity';
  _createdAt: string; // Sanity's creation timestamp
  sortOrder?: number;
  name?: string;
  icon?: SanityImage & { alt?: string };
}

// --- The Query to fetch your amenities from Sanity ---
const amenitiesQuery = groq`
  *[_type == "hubodeAmenity"] | order(coalesce(sortOrder, 9999) asc, _createdAt asc) {
    _id,
    _createdAt, // Fetching it is optional, but good for debugging/verification
    sortOrder,
    name,
    icon {
      asset, // Need the asset reference for urlFor
      alt    // Get the alt text
    }
  }
`;

// --- The React Component ---
const HubodeOfferings = () => {
  // State to store the fetched amenities
  const [amenities, setAmenities] = useState<HubodeAmenity[]>([]);
  // State to track loading status
  const [loading, setLoading] = useState(true);
  // State to store potential errors
  const [error, setError] = useState<string | null>(null);

  // useEffect runs once after the component mounts in the browser
  useEffect(() => {
    // Define the async function to fetch data
    const fetchAmenities = async () => {
      try {
        setLoading(true); // Start loading
        // Fetch data from Sanity using the client and the updated query
        const data = await client.fetch<HubodeAmenity[]>(amenitiesQuery);
        setAmenities(data || []); // Store fetched data (or empty array)
        setError(null); // Clear any previous error
      } catch (err) {
        console.error("Failed to fetch Hubode amenities:", err);
        setError("Could not load offerings."); // Set error message
        setAmenities([]); // Clear data on error
      } finally {
        setLoading(false); // Stop loading regardless of success/error
      }
    };

    // Call the fetch function
    fetchAmenities();
  }, []); // Empty array means this effect runs only once on mount

  // --- Render the component UI ---
  return (
    <div className='hfo-container-main flex items-center justify-center margin-bottom'>
      <div className="hfo-container container">
        <SectionTitle
          title="Hubode Offerings"
          subtext="Discover amenities designed for your comfort and convenience. Hubode has everything you need to live well and connect in a welcoming environment."
        />

        {/* This container uses the grid defined in your SCSS */}
        <div className="hfo-features-container">

          {/* === Loading State === */}
          {loading && (
            // Simple text loading indicator, spans full grid width
            <div className="col-span-full text-center py-8 md:py-12">
                <p className="text-gray-500 text-lg">Loading offerings...</p>
            </div>
          )}

          {/* === Error State === */}
          {error && !loading && (
            // Error message, spans full grid width
            <div className="col-span-full text-center py-8 md:py-12">
                <p className="text-red-600 font-semibold text-lg">{error}</p>
            </div>
          )}

          {/* === Success State - Render Amenities === */}
          {/* Data will now be rendered in the order fetched (_createdAt asc) */}
          {!loading && !error && amenities.length > 0 && (
            amenities.map(feature => {
              // Get image URL (handle cases where icon might be missing)
              const iconUrl = feature.icon?.asset ? urlFor(feature.icon)?.width(60).quality(80).url() : undefined;
              // Get alt text (provide fallbacks)
              const altText = feature.icon?.alt || feature.name || 'Amenity Icon';

              // Basic validation before rendering
              if (!feature._id) {
                 console.warn('Skipping amenity render due to missing _id:', feature);
                 return null;
              }

              // This maps to the .hfo-feature class in your SCSS
              return (
                <div className="hfo-feature" key={feature._id}>
                  {/* Only render image tag if iconUrl exists */}
                  {iconUrl && (
                     <div className="icon">
                       <img src={iconUrl} alt={altText} loading="lazy" width="60" height="60" />
                     </div>
                  )}
                  {/* Render name or fallback */}
                  <p>{feature.name || 'Unnamed Amenity'}</p>
                </div>
              );
            })
          )}

          {/* === No Data State === */}
           {!loading && !error && amenities.length === 0 && (
              // Styled "No offerings" message, spans full grid width
              <div className="col-span-full text-center py-8 md:py-12">
                <p className="text-gray-500 italic text-lg">
                  No offerings currently listed.
                </p>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default HubodeOfferings;
