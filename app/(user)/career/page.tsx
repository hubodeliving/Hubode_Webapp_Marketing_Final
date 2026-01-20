// File: app/careers/page.tsx (or your specific path)

import React from 'react';
import Link from 'next/link';
import groq from 'groq';
import { client } from '@/lib/sanity.client'; // <<<--- ADJUST THIS PATH to your Sanity client configuration file
import './style.scss'; // <<<--- MAKE SURE THIS FILE CONTAINS THE CSS RULE BELOW
import TopSection from '../components/TopSection/TopSection'; // <<<--- ADJUST THIS PATH if needed


export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds
// Define the TypeScript type for the fetched data
interface CareerOpening {
    _id: string;
    jobTitle: string;
    slug: string; // Projected from slug.current
    experienceRequired: string;
    location: string;
    keySkills: string; // Raw string from Sanity
}

// GROQ query to fetch published career openings, ordered by manual order
const careerQuery = groq`
  *[_type == "career" && published == true] | order(coalesce(order, 9999) asc, jobTitle asc) {
    _id,
    jobTitle,
    "slug": slug.current,
    experienceRequired,
    location,
    keySkills
  }
`;

/**
 * Helper function to process the keySkills string:
 * - Splits by comma
 * - Trims whitespace
 * - Filters out empty strings
 * - Joins them back into a single comma-separated string
 * @param skillsText The raw skills string from Sanity
 * @returns A formatted string with all skills, or 'N/A'
 */
const formatSkills = (skillsText: string | null | undefined): string => {
    if (!skillsText) {
        return 'N/A'; // Handle null, undefined, or empty string
    }
    const skillsArray = skillsText
        .split(',')
        .map(skill => skill.trim()) // Remove leading/trailing whitespace
        .filter(skill => skill !== ''); // Remove empty entries (e.g., from "skill1,,skill2")

    if (skillsArray.length === 0) {
        return 'N/A'; // Handle cases like ",,"
    }

    return skillsArray.join(', '); // Join ALL skills back with ", "
};


// This is a Server Component by default in Next.js App Router
// It fetches data directly on the server
export default async function CareerPage() {
    // Fetch career openings data from Sanity
    const careerOpenings: CareerOpening[] = await client.fetch(careerQuery);

    return (
        <div>
            {/* Top Section Component */}
            <TopSection
                title="Come Build What People Call Home."
                subtext="We’re not hiring employees. We’re growing a crew who believes in better living. Roles in ops, tech, creative, and community. If you get goosebumps over clean design, warm light, and smart systems - you’ll fit right in."
                backgroundImageUrl="/images/career-cover.png" // Ensure this image exists in your public folder
            />

            {/* ================================== */}
            {/* START: Career Cards Section        */}
            {/* ================================== */}
            <div className="career-cards-container-section flex items-center justify-center margin-bottom">
                <div className="career-cards-container container">
                    {/* Check if there are any openings */}
                    {careerOpenings && careerOpenings.length > 0 ? (
                        // Map over the fetched career openings
                        careerOpenings.map((job) => (
                            <div className="career-card-item" key={job._id}> {/* Use unique _id from Sanity as key */}
                                <h2>{job.jobTitle}</h2>
                                <div className='exp-items'>
     <p><span>Experience required :</span> {job.experienceRequired}</p>
     <p><span>Location :</span> {job.location}</p>
     {/* === Key Skills Paragraph === */}
     <p className="key-skills-paragraph"> {/* Add a class here for easier targeting */}
         <strong>Key skills :</strong>
         <span className="skills-text-content">
             {' '} {/* Space */}
             {formatSkills(job.keySkills)}
         </span>
     </p>
 </div>
                                {/* Link to the individual job detail page using the slug */}
                                {/* Assumes a route like /careers/[slug] */}
                                <Link href={`/career/${job.slug}`} className="know-more-button">
                                    {/* Ensure this image exists in your public folder */}
                                    <img src="/images/next-arrow.svg" alt="Arrow icon" /> Know More
                                </Link>
                            </div>
                        ))
                    ) : (
                        // Display a message if no openings are found
                        <p style={{ textAlign: 'center', width: '100%', padding: '2rem 0' }}>
                            Currently, there are no open positions available. Please check back later.
                        </p>
                    )}
                </div>
            </div>
            {/* ================================== */}
            {/* END: Career Cards Section          */}
            {/* ================================== */}
        </div>
    );
}

// Optional: Set revalidation time (in seconds) for Incremental Static Regeneration (ISR)
// export const revalidate = 300; // Revalidate every 5 minutes (300 seconds)
