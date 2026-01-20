// File: app/careers/[slug]/page.tsx
// --- NO CHANGES NEEDED HERE FROM THE PREVIOUS VERSION ---
// (Keep the last TSX code provided which fetches data and uses Portable Text correctly)

"use client";

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import groq from 'groq';
import { client } from '@/lib/sanity.client'; // <<< ADJUST path
import { PortableText, PortableTextComponents } from '@portabletext/react';
import urlBuilder from '@sanity/image-url';
import Image from 'next/image';
import './style.scss'; // <<< Ensure this is imported

// --- Type based on ORIGINAL simple schema ---
interface CareerDetail {
    _id: string;
    jobTitle: string;
    experienceRequired: string;
    location: string;
    keySkills: string;
    jobDescription: any; // Portable Text array - expected to contain ALL other content
}

// --- Query based on ORIGINAL simple schema ---
const careerDetailQuery = groq`
  *[_type == "career" && slug.current == $slug && published == true][0] {
    _id,
    jobTitle,
    experienceRequired,
    location,
    keySkills,
    jobDescription // Fetching the single Portable Text field for rest of content
  }
`;

// --- Helper Functions ---
const formatSkills = (skillsText: string | null | undefined): string => {
    // Ensure space after comma for wrapping
    if (!skillsText) return 'N/A';
    const skillsArray = skillsText.split(',').map(s => s.trim()).filter(s => s !== '');
    return skillsArray.length > 0 ? skillsArray.join(', ') : 'N/A';
};
function urlFor(source: any) { return urlBuilder(client).image(source); }
const getImageDimensions = (id: string) => {
    const regex = /-(\d+x\d+)-(\w+)$/;
    const match = id.match(regex);
    if (match && match[1]) {
        const [width, height] = match[1].split('x').map(Number);
        if (!isNaN(width) && !isNaN(height)) return { width, height, aspectRatio: width / height };
    }
    return { width: 800, height: 600, aspectRatio: 800 / 600 }; // Fallback
};

// --- Page Props ---
interface PageProps { params: { slug: string }; }

// --- Page Component ---
export default function CareerDetailPage({ params }: PageProps) {
    const [careerOpening, setCareerOpening] = useState<CareerDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

    // --- Portable Text Component Definitions (Essential for Styling) ---
    const ptComponents: PortableTextComponents = {
        types: {
            image: ({ value }) => { // Handle images if used within PT
                if (!value?.asset?._ref) return null;
                const { width, height } = getImageDimensions(value.asset._ref);
                return (
                    <Image
                        src={urlFor(value).width(width).fit('max').auto('format').url()}
                        alt={value.alt || 'Content image'}
                        loading="lazy"
                        width={width} height={height}
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="portable-text-image"
                    />
                );
            },
        },
        marks: {
            link: ({ children, value }) => {
                 const rel = !value?.href?.startsWith('/') ? 'noreferrer noopener' : undefined;
                 const target = value?.blank ? '_blank' : undefined;
                 return (<a href={value?.href} rel={rel} target={target} className="portable-text-link">{children}</a>);
             },
            // Crucial: Apply specific class to strong tags for label styling
            strong: ({ children }) => <strong className="portable-text-strong">{children}</strong>,
            em: ({ children }) => <em className="portable-text-em">{children}</em>,
        },
        block: {
            // H2 for section titles like "Job Details", "Job Description"
            h2: ({ children }) => <h2 className="portable-text-h2">{children}</h2>,
            // Normal Paragraphs (will contain label:value pairs and description text)
            normal: ({ children }) => <p className="portable-text-normal">{children}</p>,
            // Add h3/h4/blockquote if needed, with classes
            h3: ({ children }) => <h3 className="portable-text-h3">{children}</h3>,
            blockquote: ({ children }) => <blockquote className="portable-text-blockquote">{children}</blockquote>,
        },
        list: {
            // Essential for "Roles & Responsibilities"
            bullet: ({ children }) => <ul className="portable-text-ul">{children}</ul>,
            number: ({ children }) => <ol className="portable-text-ol">{children}</ol>,
        },
        listItem: ({ children }) => <li className="portable-text-li">{children}</li>,
    };

    // --- Fetch Data ---
    useEffect(() => {
         const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await client.fetch<CareerDetail | null>(careerDetailQuery, { slug: params.slug });
                if (!data) {
                    setError("Job opening not found or not published.");
                    setCareerOpening(null);
                } else {
                    setCareerOpening(data);
                }
            } catch (err) {
                console.error("Failed to fetch career detail:", err);
                setError("Failed to load job details. Please try again later.");
                setCareerOpening(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [params.slug]);

    const toggleFormVisibility = () => setIsFormVisible(!isFormVisible);

    const handleApplicationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!careerOpening) return;

        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        const formElement = event.currentTarget;
        const formData = new FormData(formElement);
        formData.append('jobTitle', careerOpening.jobTitle);
        formData.append('jobSlug', params.slug);

        try {
            const response = await fetch('/api/career-applications', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.error || 'Failed to submit application.');
            }

            setSubmitSuccess('Application submitted successfully!');
            formElement.reset();
        } catch (submitErr: any) {
            setSubmitError(submitErr?.message || 'Failed to submit application.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Loading/Error/NotFound ---
    if (isLoading) return <div className="loading-container"><p>Loading...</p></div>;
    if (error) return <div className="error-container"><p>{error}</p></div>;
    if (!careerOpening) return notFound();

    // --- Render Main Content ---
    return (
        // Main wrapper controls padding and max-width, NO background/shadow
        <div className='career-page-container-main flex items-center justify-center'>

                <div className="career-page-container container">
                    {/* Using the structure from your last TSX snippet */}
                {/* Top Section (From specific fields) */}
                <div className="top-section">
                    <h1 className="job-title">{careerOpening.jobTitle}</h1>
                    <div className="features-container">
                        <p><span>Experience :</span> {careerOpening.experienceRequired}</p>
                        <p><span>Location :</span> {careerOpening.location}</p>
                         <p className="key-skills-line"><span>Key Skills :</span> <span className="key-skills-value">{formatSkills(careerOpening.keySkills)}</span></p>
                    </div>
                </div>

                {/* Rich Text Section (Renders EVERYTHING else from PT) */}
                <div className="rich-text-section">
                    {careerOpening.jobDescription && (
                        <PortableText value={careerOpening.jobDescription} components={ptComponents} />
                    )}
                </div>

                 {/* Apply Button (Positioned after rich text) */}
                <div className="apply-button-wrapper">
                    <button onClick={toggleFormVisibility} className="apply-now-button">
                        {isFormVisible ? 'Cancel Application' : 'Apply'}
                    </button>
                </div>

                {/* Application Form (Conditional) */}
                {isFormVisible && (
                    <div className="application-form-wrapper">
                        <h3>Apply for {careerOpening.jobTitle}</h3>
                        <form className="application-form" onSubmit={handleApplicationSubmit}>
                            {/* Form layout needs styling */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name <span className='required'>*</span></label>
                                    <input type="text" id="firstName" name="firstName" required disabled={isSubmitting} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name <span className='required'>*</span></label>
                                    <input type="text" id="lastName" name="lastName" required disabled={isSubmitting} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="email">Email <span className='required'>*</span></label>
                                    <input type="email" id="email" name="email" required disabled={isSubmitting} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phone">Phone <span className='required'>*</span></label>
                                    <input type="tel" id="phone" name="phone" required disabled={isSubmitting} />
                                </div>
                            </div>
                            <div className="form-group full-width"> {/* Example class for single-column rows */}
                                <label htmlFor="cv">Upload CV <span className='required'>*</span></label>
                                <input type="file" id="cv" name="cv" accept=".pdf,.doc,.docx" required disabled={isSubmitting} />
                                <p className="file-upload-info">Max file size: 2MB. Accepted formats: PDF, DOC, DOCX.</p>
                            </div>
                            <div className="form-group submit-group">
                                <button type="submit" className="submit-application-button" disabled={isSubmitting}>
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                </button>
                            </div>
                            {submitError && <p className="form-feedback error">{submitError}</p>}
                            {submitSuccess && <p className="form-feedback success">{submitSuccess}</p>}
                        </form>
                    </div>
                )}
                </div>
        </div> // End .career-page-container-main
    );
}
