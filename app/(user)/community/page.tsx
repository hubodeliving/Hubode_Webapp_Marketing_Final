// FILE: app/(user)/community/page.tsx

import React from 'react';
import TopSection from '../components/TopSection/TopSection'; // Adjust path if needed
import './style.scss'; // CRITICAL: This file MUST load the styles below
// Import necessary Sanity helpers - adjust paths based on your project structure
import { client } from '@/sanity/lib/client'; // Your configured Sanity client
import { urlFor } from '@/sanity/lib/image'; // Your urlFor image helper
import { groq } from 'next-sanity'; // Or import { groq } from 'groq'

export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds

// --- Define the CommunityItem interface matching your schema ---
interface CommunityItem {
  _id: string;
  title?: string;
  eventDate?: string; // Date string (e.g., "YYYY-MM-DD")
  image?: {
    asset?: {
      _ref: string;
      _type: 'reference';
    };
    alt?: string;
  };
}
// --- End of interface definition ---

// Helper function to format the date (can be moved to a utils file)
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Date not set';
    try {
      const [year, month, day] = dateString.split('-');
      const shortYear = year.slice(-2); // Get last two digits of year
      return `${day}-${parseInt(month, 10)}-${shortYear}`; // Basic formatting
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString; // Fallback on error
    }
};

// Define the GROQ query to fetch ALL community items, ordered by date descending
const communityItemsQuery = groq`*[_type == "communityItem"] | order(eventDate desc) {
  _id,
  title,
  eventDate,
  image {
    asset,
    alt
  }
}`;

// --- Make the page component async to fetch data ---
const CommunityPage = async () => {

  // Fetch data directly within the Server Component
  let communityItems: CommunityItem[] = [];
  let fetchError: string | null = null;

  try {
    communityItems = await client.fetch<CommunityItem[]>(communityItemsQuery);
  } catch (error) {
    console.error("Failed to fetch community items:", error);
    fetchError = "Could not load community events. Please try again later.";
    communityItems = [];
  }

  const hasEvents = communityItems && communityItems.length > 0;

  return (
    <div>
        <TopSection
            title="Meet the Hive."
            subtext="We call it The Co-Op. Not just roommates. Here you will find Co-thinkers. Co-creators. Co-doers."
            backgroundImageUrl='/images/community-cover.png'
        />

        <div className='community-section-container-main flex items-center justify-center margin-bottom'>
            <div className="community-section container">
                <div className="community-items-container"> {/* Grid container */}

                    {/* Handle Fetch Error State */}
                    {fetchError && (
                        <div className="error-message-container" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2em', color: 'red' }}>
                            <p>{fetchError}</p>
                        </div>
                    )}

                    {/* Handle No Events State */}
                    {!fetchError && !hasEvents && (
                        // THIS is the div that needs styling from your SCSS
                        <div className="no-events-message-container">
                            <p>No community events found yet. Check back soon!</p>
                        </div>
                    )}

                    {/* Render Events if available */}
                    {!fetchError && hasEvents && (
                        communityItems.map(item => (
                           item.image?.asset ? (
                                <div
                                    className="community-item"
                                    key={item._id}
                                    style={{ backgroundImage: `url('${urlFor(item.image).url()}')` }}
                                >
                                    <div className="card-content">
                                        <h5>{item.title || 'Untitled Event'}</h5>
                                        <div className="date-container">
                                            <img src="/images/calendar-white.svg" alt="Calendar" />
                                            <p>Added on {formatDate(item.eventDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="community-item community-item-placeholder" key={item._id}>
                                   {/* ... placeholder content ... */}
                                    <div className="card-content">
                                        <h5>{item.title || 'Untitled Event'}</h5>
                                        <p>Image not available</p>
                                        <div className="date-container">
                                            <img src="/images/calendar-white.svg" alt="Calendar" />
                                            <p>Added on {formatDate(item.eventDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}

export default CommunityPage;