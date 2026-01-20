"use client" // Required for useState, useEffect, and event handlers

import React, { useState, useEffect } from 'react';
// Use the exact SCSS import path provided in your last code block
import './fqall.scss';
// Keep these imports if they were in your original file, even though not used in the JSX below
// import SectionTitle from '../SectionTitle/SectionTitle';
// import Button from '../Button/Button';

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
  question?: string;
  answer?: string;
}

// --- GROQ Query ---
// Fetches ALL FAQ documents, orders them by creation date (NEWEST first).
const faqAllQuery = groq`
  *[_type == "faq"] | order(_createdAt desc) {
    _id,
    _createdAt,
    question,
    answer
  }
`;

// Keep the original component name and structure
const FaqSection = () => {
  // State for fetched FAQs
  const [faqs, setFaqs] = useState<FaqItemSanity[]>([]);
  // State to track the ID of the currently open/active question (string for Sanity _id)
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchAllFaqs = async () => {
      try {
        setLoading(true);
        const data = await client.fetch<FaqItemSanity[]>(faqAllQuery);
        setFaqs(data || []); // Store fetched data or empty array

        // Set the first fetched FAQ (newest) as active by default, if data exists
        if (data && data.length > 0) {
          setActiveFaqId(data[0]._id);
        } else {
          setActiveFaqId(null); // No data, no active ID
        }
        setError(null); // Clear previous errors
      } catch (err) {
        console.error("Failed to fetch all FAQs:", err);
        setError("Could not load FAQs at this time.");
        setFaqs([]); // Clear data on error
        setActiveFaqId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAllFaqs();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Find the currently active FAQ object from the fetched state
  const activeFaq = faqs.find(faq => faq._id === activeFaqId);

  // Updated handler to use string IDs
  const handleQuestionClick = (id: string) => {
    setActiveFaqId(id);
  };

  // --- Render the component using the EXACT structure from your last example ---
  return (
    // Keep original outer div and classes
    <div className='faq-section-container-main flex items-center justify-center margin-bottom'>
        {/* Keep original inner div and classes */}
        <div className="faq-section container">

             {/* Keep original questions container div and classes */}
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
                    {/* Keep original open container structure and classes */}
                    {activeFaq && (
                      <div className="question-open-container">
                        {/* Keep original mascot section structure and classes */}
                        <div className="mascot-section">
                            <img src="/images/faq-mascot.svg" alt="Hubode Mascot" />
                        </div>
                        {/* Keep original content section structure and classes */}
                        <div className="content-section">
                            {/* Use Sanity _id for key */}
                            <div key={activeFaq._id} className="content-wrapper">
                              {/* Use data from activeFaq state */}
                              <h5>{activeFaq.question || 'Question not available'}</h5>
                              <p>{activeFaq.answer || 'Answer not available'}</p>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* --- Render the List of Closed Questions --- */}
                    {/* Map over the fetched 'faqs' state */}
                    {faqs.map(faq => (
                      // Use Sanity _id for comparison
                      faq._id !== activeFaqId && (
                        // Keep original close container structure and classes
                        <div
                          className="question-close-container"
                          key={faq._id} // Use Sanity _id for key
                          onClick={() => handleQuestionClick(faq._id)} // Pass string _id
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleQuestionClick(faq._id)} // Pass string _id
                        >
                            {/* Use data from faq map item */}
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

        </div>
    </div>
  );
};

// Keep original export
export default FaqSection;