// components/CommunitySection/CommunitySection.tsx
// CLIENT-SIDE FETCHING EXAMPLE - CORRECTED
"use client"

import React, { useState, useEffect } from 'react';
import './cs.scss';
import SectionTitle from '../SectionTitle/SectionTitle';
import Button from '../Button/Button';
import { urlFor } from '@/sanity/lib/image';
// *** Make sure this client import path is correct for your project ***
import { client } from '@/sanity/lib/client'; // Assuming this is your configured Sanity client
import { groq } from 'next-sanity';

export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds

// Interface matching your Sanity schema (communityItem)
interface CommunityItem {
  _id: string;
  title?: string;
  eventDate?: string; // Assuming eventDate exists in your schema
  image?: {
    asset?: {
      _ref: string;
      _type: 'reference';
    };
    alt?: string;
  };
}

// Helper function to format the date
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Date not set';
    try {
      const [year, month, day] = dateString.split('-');
      const shortYear = year.slice(-2);
      return `${day}-${parseInt(month, 10)}-${shortYear}`;
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
};


// Component fetches its own data client-side
const CommunitySection: React.FC = () => {
  const [communityEvents, setCommunityEvents] = useState<CommunityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query for 'communityItem' documents
  const communityItemsQuery = groq`*[_type == "communityItem"] | order(eventDate desc) [0...4] {
    _id,
    title,
    eventDate, // Make sure your schema has 'eventDate' if you query it
    image { asset, alt }
  }`;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Use the imported 'client'
        const data = await client.fetch<CommunityItem[]>(communityItemsQuery);
        setCommunityEvents(data ?? []);
      } catch (err) {
        console.error("Failed to fetch community items client-side:", err);
        setError("Could not load community events.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Only include the query string in dependency array if it could actually change at runtime
    // Otherwise, an empty array [] is fine to run only once on mount.
  }, [communityItemsQuery]);

  const hasEvents = !isLoading && !error && communityEvents && communityEvents.length > 0;

  // --- Determine content based on loading/error/data states ---
  let content;
  if (isLoading) {
    content = <div className="loading-message-container"><p>Loading events...</p></div>; // Style this class
  } else if (error) {
    content = <div className="error-message-container"><p>{error}</p></div>; // Style this class
  } else if (hasEvents) {
    // *** THIS IS THE CORRECTED PART ***
    content = communityEvents.map(item => (
       item.image?.asset ? (
         // --- Actual Item Rendering ---
         <div
           className="community-item"
           key={item._id}
           style={{
             backgroundImage: `url('${urlFor(item.image).url()}')`
           }}
         >
           <div className="card-content">
             <h5>{item.title || 'Untitled Event'}</h5>
             <div className="date-container">
                 <img src="/images/calendar-white.svg" alt="Calendar" />
                 {/* Use item.eventDate if you are fetching it */}
                 <p>Added on {formatDate(item.eventDate)}</p>
             </div>
           </div>
         </div>
         // --- End Actual Item Rendering ---
       ) : (
         // --- Actual Placeholder Rendering ---
         <div className="community-item community-item-placeholder" key={item._id}>
            <div className="card-content">
             <h5>{item.title || 'Untitled Event'}</h5>
              <p>Image not available</p>
             <div className="date-container">
                 <img src="/images/calendar-white.svg" alt="Calendar" />
                  {/* Use item.eventDate if you are fetching it */}
                 <p>Added on {formatDate(item.eventDate)}</p>
             </div>
           </div>
         </div>
         // --- End Actual Placeholder Rendering ---
       )
    ));
    // *** END OF CORRECTION ***
  } else {
    // No events found message (after loading and no error)
    content = (
      <div className="no-events-message-container">
        <p>No community events found yet. Check back soon!</p>
      </div>
    );
  }
  // --- End of determining content ---


  return (
    <div className='community-section-container-main flex items-center justify-center margin-bottom'>
        <div className="community-section container">
            {/* Pass relevant subtext */}
            <SectionTitle
                title="Meet the Hive."
                subtext="We call it The Co-Op. Not just roommates. Here you will find Co-thinkers. Co-creators. Co-doers."
            />
            {/* Render the determined content */}
            <div className="community-items-container">
                {content}
            </div>
            {/* Conditionally render button based on whether events were successfully loaded */}
            {hasEvents && (
                <div className="button-section-container flex flex-col items-center justify-center">
                    <Button text="View All" href="/community" />
                </div>
            )}
        </div>
    </div>
  );
};


export default CommunitySection;