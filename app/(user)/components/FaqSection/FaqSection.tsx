"use client" // Required for useState, useEffect, and event handlers

import React, { useState, useEffect } from 'react';
import './faq.scss'; // Styles for this component
import SectionTitle from '../SectionTitle/SectionTitle'; // Reusable title
import Button from '../Button/Button'; // Reusable button

// --- Sanity Imports ---
import { client } from '@/sanity/lib/client'; // Adjust path if needed
import { groq } from 'next-sanity';

export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds

// --- TypeScript Type for Fetched Sanity Data ---
interface FaqItemSanity {
  _id: string; // Sanity uses string IDs
  _type: 'faq';
  _createdAt: string;
  question?: string; // Use optional chaining in case data is missing
  answer?: string;
}

// --- GROQ Query ---
// Fetches FAQ documents, orders them by creation date (oldest first),
// and limits the result to the first 4 items.
const faqQuery = groq`
  *[_type == "faq"] | order(_createdAt asc) [0...4] {
    _id,
    _createdAt,
    question,
    answer
  }
`;

const FaqSection = () => {
  // State for fetched FAQs
  const [faqs, setFaqs] = useState<FaqItemSanity[]>([]);
  // State to track the ID of the currently open/active question
  // Initialize with null, will be set after data is fetched
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const data = await client.fetch<FaqItemSanity[]>(faqQuery);
        setFaqs(data || []); // Store fetched data or empty array

        // Set the first fetched FAQ as active by default, if data exists
        if (data && data.length > 0) {
          setActiveFaqId(data[0]._id);
        } else {
          setActiveFaqId(null); // No data, no active ID
        }
        setError(null); // Clear previous errors
      } catch (err) {
        console.error("Failed to fetch FAQs:", err);
        setError("Could not load FAQs at this time.");
        setFaqs([]); // Clear data on error
        setActiveFaqId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Find the currently active FAQ object from the fetched state
  // Use optional chaining and nullish coalescing for safety
  const activeFaq = faqs.find(faq => faq._id === activeFaqId);

  const handleQuestionClick = (id: string) => {
    setActiveFaqId(id);
  };

  return (
    <div className='faq-section-container-main flex items-center justify-center margin-bottom'>
        <div className="faq-section container">
            <SectionTitle
              title="Let’s Clear the Air"
              subtext='We know coliving comes with questions. Lucky for you, we’ve already heard most of them (some twice). So ask away or just scroll and nod like you already knew.'
             />

             <div className="questions-container">

                {/* === Loading State === */}
                {loading && (
                   <div className="loading-placeholder text-center py-10 text-gray-500">
                       Loading FAQs...
                   </div>
                )}

                {/* === Error State === */}
                {error && !loading && (
                    <div className="error-message text-center py-10 text-red-600 font-semibold">
                        {error}
                    </div>
                )}

                {/* === Success State (Data Loaded) === */}
                {!loading && !error && faqs.length > 0 && (
                  <>
                    {/* --- Render the Open/Active Question --- */}
                    {activeFaq && (
                      <div className="question-open-container">
                        {/* Mascot Section */}
                        <div className="mascot-section">
                            <img src="/images/faq-mascot.svg" alt="Hubode Mascot" />
                        </div>
                        {/* Content Section */}
                        <div className="content-section">
                            {/* Keying helps React recognize changes for potential animations */}
                            <div key={activeFaq._id} className="content-wrapper">
                              {/* Use fallback text if question/answer is missing */}
                              <h5>{activeFaq.question || 'Question not available'}</h5>
                              <p>{activeFaq.answer || 'Answer not available'}</p>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* --- Render the List of Closed Questions --- */}
                    {faqs.map(faq => (
                      // Only render if it's NOT the active one
                      faq._id !== activeFaqId && (
                        <div
                          className="question-close-container"
                          key={faq._id} // Use Sanity's string _id as the key
                          onClick={() => handleQuestionClick(faq._id)}
                          role="button"
                          tabIndex={0} // Make it focusable
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleQuestionClick(faq._id)} // Keyboard accessible
                        >
                            <p>{faq.question || 'Question not available'}</p>
                            <img src="/images/down-arrow-green.svg" alt="Expand question" />
                        </div>
                      )
                    ))}
                  </>
                )}

                {/* === No Data State === */}
                {!loading && !error && faqs.length === 0 && (
                    <div className="no-data-message text-center py-10 text-gray-500 italic">
                        No FAQs found. Check back later!
                    </div>
                )}
             </div>

             <div className="button-row-container flex items-center justify-center">
                {/* Button links to the dedicated FAQ page */}
                <Button text="View All" href="/faq" />
             </div>
        </div>
    </div>
  );
};

export default FaqSection;