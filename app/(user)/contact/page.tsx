// File: app/(user)/contact/page.tsx

"use client"; // Needed for useState

import React, { useState } from 'react'; // Import useState
// Removed unused useEffect, notFound, groq
import { client } from '@/lib/sanity.client'; // Keep for urlFor (assumes this is the READ client)
import urlBuilder from '@sanity/image-url';

// Import your existing components (Ensure paths are correct)
import TopSection from '../../components/TopSection/TopSection'; // <<< ADJUST PATH if needed
import './style.scss'; // Import styles

// --- Helper Function (using the imported read client) ---
function urlFor(source: any) {
    // Ensure client is the configured Sanity Client instance for reads
    if (!client || !source?.asset) return '';
    try {
        return urlBuilder(client).image(source).auto('format').fit('max').url();
    } catch (error) {
        console.error("Error building image URL:", error);
        return ''; // Return empty string on error
    }
}

// --- Page Component ---
export default function ContactPage() {

    // --- State Variables for Form ---
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false); // Optional: for UI feedback beyond alert

    // --- Input Change Handler ---
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
        // Clear errors when user starts typing again
        if (submitError) setSubmitError(null);
        if (submitSuccess) setSubmitSuccess(false);
    };

    // --- Form Submission Handler (Using API Route) ---
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevent default browser submission
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        // Basic client-side validation
        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim() || !formData.phone.trim()) {
            setSubmitError("Please fill out all required fields.");
            setIsSubmitting(false);
            return; // Stop submission
        }

        try {
            // Send data to your Next.js API route
            const response = await fetch('/api/contact', { // <<< TARGET THE API ROUTE
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), // Send the current form data state
            });

            // Check if the request was successful
            if (!response.ok) {
                let errorData;
                try {
                    // Try to parse error message from API response body
                    errorData = await response.json();
                } catch (parseError) {
                    // If parsing fails, use the status text
                    throw new Error(response.statusText || `Request failed with status ${response.status}`);
                }
                // Throw an error with the message from the API or a default
                throw new Error(errorData?.error || `Request failed with status ${response.status}`);
            }

            // Handle success from the API route
            // const result = await response.json(); // Optional: You can use the result if your API sends back useful data
            // console.log('API Success Response:', result);

            setFormData({ name: '', phone: '', email: '', message: '' }); // Clear form
            setSubmitSuccess(true); // Set success state
            alert('Thank you! Your message has been sent successfully.'); // Show success alert as requested

        } catch (error) {
            // Handle errors from fetch or the API route
            console.error('Error submitting contact form:', error);
            setSubmitError(error instanceof Error ? error.message : 'Sorry, there was an error sending your message. Please try again.');
            setSubmitSuccess(false); // Ensure success is false on error
        } finally {
            // Reset submitting state regardless of outcome
            setIsSubmitting(false);
        }
    };

    // --- Contact Hero Background Style ---
    // Ensure the path '/images/contact-cover.png' is correct relative to your 'public' directory
    const contactBackgroundStyle = {
        backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.2) 70%), url('/images/contact-cover.png')`
    };


    // --- Return JSX ---
    return (
        <div>
            {/* ============================== */}
            {/* START: Contact Top Section     */}
            {/* ============================== */}
            <div
                className='topsection-container-main flex margin-bottom items-center justify-center contact-hero'
                style={contactBackgroundStyle}
            >
                <div className="topsection-container container">
                    <div className="content-container">
                        <h1>Let's Talk Living</h1>
                        <p className='subtext'>A query, a compliment, a curious thought? We're here for all of it. No bots. No loops. Just people, talking to people.</p>
                        <div className="btn-row">
                            {/* Ensure email and phone are correct */}
                            <a href="mailto:support@hubodeliving.com" className="email-btn">
                                <img src="/images/email-contact.svg" alt="Email icon" />
                                <p>Email us: support@hubodeliving.com</p>
                            </a>
                            {/* Replace 'yourphonenumber' with your actual number */}
                            <a href="https://wa.me/yourphonenumber?text=Hi%20Hubode!" target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
                                <img src="/images/whatsapp-contact.svg" alt="WhatsApp icon" />
                                <p>Chat with us</p>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            {/* ============================== */}
            {/* END: Contact Top Section       */}
            {/* ============================== */}


            {/* ============================== */}
            {/* START: Contact Form Section    */}
            {/* ============================== */}
            <div className="contact-form-section-container flex items-center justify-center margin-bottom">
                <div className="contact-form-section container">
                    {/* Left Informational Section */}
                    <div className="left-section">
                        <h5>Hey There</h5>
                        <h2>Ping Us Anytime</h2>
                        <p>
                            Drop your name, number, and message. We'll reply with the same energy you bring. Or better yet, swing by! We love a good chat - especially over a map and a cuppa. Find us below, message us above. Either way, we're listening.
                        </p>
                    </div>

                    {/* Right Form Section */}
                    <div className="right-section">
                        {/* The Form */}
                        <form className="contact-form" onSubmit={handleFormSubmit} noValidate> {/* Added noValidate to rely on custom validation */}
                            {/* Row 1: Name & Phone */}
                            <div className="form-row form-row-split">
                                <div className="form-group">
                                    <label htmlFor="contact-name">Name</label>
                                    <input
                                        type="text"
                                        id="contact-name"
                                        name="name" // Matches state key
                                        placeholder="Enter your First Name"
                                        value={formData.name} // Controlled component
                                        onChange={handleInputChange} // Update state
                                        required // Keep for browser indication, but validation is handled in JS
                                        disabled={isSubmitting} // Disable during submit
                                        aria-required="true"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="contact-phone">Phone</label>
                                    <input
                                        type="tel"
                                        id="contact-phone"
                                        name="phone" // Matches state key
                                        placeholder="Enter your Phone Number"
                                        value={formData.phone} // Controlled component
                                        onChange={handleInputChange} // Update state
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Email */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="contact-email">Email</label>
                                    <input
                                        type="email"
                                        id="contact-email"
                                        name="email" // Matches state key
                                        placeholder="Enter your email"
                                        value={formData.email} // Controlled component
                                        onChange={handleInputChange} // Update state
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Message */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="contact-message">Message</label>
                                    <textarea
                                        id="contact-message"
                                        name="message" // Matches state key
                                        placeholder="Enter your Message"
                                        rows={5}
                                        value={formData.message} // Controlled component
                                        onChange={handleInputChange} // Update state
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Row 4: Button & Feedback */}
                            <div className="form-row form-row-submit">
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={isSubmitting} // Disable button when submitting
                                >
                                    {isSubmitting ? 'Sending...' : 'Send It Over'}
                                </button>
                            </div>

                            {/* Feedback Messages Area */}
                            {/* Shows error message if submission fails */}
                            {submitError && (
                                <div className="form-row" style={{ marginTop: '1rem' }}>
                                    <p className="form-feedback error" role="alert" style={{ color: 'red', width: '100%', textAlign: 'left' }}>
                                        {submitError}
                                    </p>
                                </div>
                            )}
                            {/* You could optionally add a non-alert success message here */}
                             {/* {submitSuccess && !submitError && (
                                <div className="form-row" style={{ marginTop: '1rem' }}>
                                    <p className="form-feedback success" role="status" style={{ color: 'green', width: '100%', textAlign: 'left' }}>
                                        Message sent successfully!
                                     </p>
                                 </div>
                             )} */}
                        </form>
                    </div> {/* End .right-section */}
                </div> {/* End .contact-form-section */}
            </div> {/* End .contact-form-section-container */}
            {/* ============================== */}
            {/* END: Contact Form Section      */}
            {/* ============================== */}


            {/* ============================== */}
            {/* START: Map Section             */}
            {/* ============================== */}
            <div className="map-section-container flex items-center justify-center margin-bottom">
                <div className="map-section container">
                    <div className="map-iframe-wrapper">
                        {/* Ensure the embed URL is correct */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3912.6955837389587!2d75.78076287577207!3d11.2837732496293!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba65ec77ae662ed%3A0xb1559cb1b6907db!2sAshirvad%20Lawns%20-%20Convention%20Centre!5e0!3m2!1sen!2sin!4v1745732959408!5m2!1sen!2sin" // Example URL, replace if needed
                            style={{ border: 0, width: '100%', height: '450px' }} // Added width/height example
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Location Map" // Important for accessibility
                        ></iframe>
                    </div>
                </div>
            </div>
            {/* ============================== */}
            {/* END: Map Section               */}
            {/* ============================== */}

        </div> // End main wrapper 
    );
};