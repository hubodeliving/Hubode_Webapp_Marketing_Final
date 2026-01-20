// File: app/(user)/refer-a-friend/page.tsx

"use client"; // Required for useState

import React, { useState } from 'react'; // Import useState
import './style.scss'; // Assuming styles are in the same folder or adjust path
import TopSection from '../components/TopSection/TopSection'; // Adjust path if needed
import SectionTitle from '../components/SectionTitle/SectionTitle'; // Adjust path if needed

// --- Data (Keep as is) ---
const stepsData = [
    { icon: "/images/refer-step1.svg", iconAlt: "Invite icon", title: "Invite a Friend", text: "Complete the form below to refer a friend who would love to join our community!" },
    { icon: "/images/refer-step2.svg", iconAlt: "Confirmation icon", title: "Receive Confirmation", text: "Get an email confirmation from us once your referral is submitted successfully!" },
    { icon: "/images/refer-step3.svg", iconAlt: "Reward icon", title: "Earn Your Reward", text: "Claim your cash reward after your friend books their stay with us. It's as easy as that!" }
];

const termsData = [
    "Referrals can only be made by an existing Hubode resident, unless confirmed in writing by the Hubode team before submitting the form.",
    "The referred person must not already exist in the Hubode CRM or have contacted Hubode prior to the submission date.",
    "The Hubode team verifies and confirms referrals internally after system checks.",
    "Referrer receives a 10% discount on their next rent bill (based on referred unit's first-month rent), only after the new resident completes 30 days of stay and Hubode receives full payment.",
    "The discount amount is finalized at the referred resident's booking and applied within 30 days of their 30-day stay completion and dues clearance."
];

const genderOptions = ["Female", "Male", "Other"];
const locationOptions = ["Hubode Roots, Kozhikode"];
// --- End Data ---


export default function ReferFriendPage() { // Use PascalCase

    // --- Form State ---
    const initialFormData = {
        yourName: '',
        yourEmail: '',
        yourPhone: '',
        friendName: '',
        friendEmail: '',
        friendPhone: '',
        friendGender: '', // Store the selected value
        interestedLocation: '', // Store the selected value
        termsAgree: false // Store checkbox state
    };
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
    // --- End Form State ---

    // --- Input Change Handler ---
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = event.target;

        // Handle checkbox separately
        if (type === 'checkbox') {
             const { checked } = event.target as HTMLInputElement;
             setFormData(prevData => ({
                ...prevData,
                [name]: checked // Use the boolean 'checked' value
             }));
        } else {
             setFormData(prevData => ({
                ...prevData,
                [name]: value // Use the string 'value' for others
             }));
        }

        // Clear previous feedback when user types again
        if (submitError) setSubmitError(null);
        if (submitSuccess) setSubmitSuccess(false);
    };
    // --- End Input Change Handler ---


    // --- Form Submission Handler ---
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        // --- Client-Side Validation ---
        if (!formData.yourName || !formData.yourEmail || !formData.friendName || !formData.friendEmail || !formData.friendPhone || !formData.friendGender || !formData.interestedLocation) {
            setSubmitError("Please fill out all required fields marked with *.");
            setIsSubmitting(false);
            return;
        }
         if (!formData.termsAgree) {
             setSubmitError("You must agree to the terms and conditions to submit the referral.");
             setIsSubmitting(false);
             return;
         }
        // Optional: Add regex validation for email/phone here if desired for better UX
        // --- End Client-Side Validation ---

        try {
            // Send data to your Next.js API route
            const response = await fetch('/api/referral', { // <<< TARGET THE NEW API ROUTE
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), // Send the current form data state
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (parseError) {
                    throw new Error(response.statusText || `Request failed with status ${response.status}`);
                }
                throw new Error(errorData?.error || `Request failed with status ${response.status}`);
            }

            // Handle success
            setFormData(initialFormData); // Clear the form
            setSubmitSuccess(true);
            // alert('Referral submitted successfully! Thank you.'); // Optional: use alert or the success message below

        } catch (error) {
            console.error('Error submitting referral form:', error);
            setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
            setSubmitSuccess(false);
        } finally {
            setIsSubmitting(false);
        }
    };
    // --- End Form Submission Handler ---


    // --- Return JSX ---
    return (
        <div>
            <TopSection
                title="Hubode Referral Program"
                subtext="For a complete living experience, nothing beats having your crew close by. Refer a friend and bring them home to Hubode. Because you live better when Your People live next door."
                backgroundImageUrl="/images/refer-a-friend-cover.png"
            />

            {/* How it works section (Keep as is) */}
            <div className="how-it-works-section-container flex items-center justify-center margin-bottom">
                <div className="how-it-works-section container">
                    <SectionTitle title="Share, Earn, Thrive!" subtext="Follow these easy steps to unlock rewards through our referral program and enrich your Hubode community experience!" />
                    <div className="steps-cards-container">
                        {stepsData.map((step, index) => (
                            <div className="step-item" key={index}>
                                <div className="icon-container"><img src={step.icon} alt={step.iconAlt} /></div>
                                <h5 className="step-title">{step.title}</h5>
                                <p>{step.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             {/* End How it works section */}

            {/* Referral Form Section */}
            <div className="referal-form-section-container flex items-center justify-center margin-bottom">
                <div className="referal-form-section container">
                    <SectionTitle title="Squad Up" subtext="Fill out the form to invite a friend to Hubode!" />

                    {/* Terms and Conditions (Keep as is) */}
                    <div className="terms-conditions-container">
                        <h5 className="section-subtitle">Terms and conditions</h5>
                        <div className="items-container">
                            {termsData.map((term, index) => (
                                <div className="term-item" key={index}>
                                    <div className="term-icon"><img src="/images/check-green.svg" alt="Checkmark icon" /></div>
                                    <p>{term}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                     {/* End Terms and Conditions */}


                    {/* --- The Form --- */}
                    <div className="referal-form-container">
                        {/* Use the new handler */}
                        <form className="referral-form" onSubmit={handleFormSubmit} noValidate>

                            {/* Row 1: Your Name / Your Email */}
                            <div className="form-row form-row-split">
                                <div className="form-group">
                                    <label htmlFor="your-name">My Name is *</label>
                                    <input
                                        type="text"
                                        id="your-name"
                                        name="yourName" // Matches state key
                                        placeholder="Enter your Name"
                                        value={formData.yourName}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="your-email">My Email id is*</label>
                                    <input
                                        type="email"
                                        id="your-email"
                                        name="yourEmail" // Matches state key
                                        placeholder="Enter your Email"
                                        value={formData.yourEmail}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                     />
                                </div>
                            </div>

                            {/* Row 2: Your Phone / Friend's Name */}
                            <div className="form-row form-row-split">
                                <div className="form-group">
                                    <label htmlFor="your-phone">My Phone Number is</label>
                                    <input
                                        type="tel"
                                        id="your-phone"
                                        name="yourPhone" // Matches state key
                                        placeholder="Enter your phone no"
                                        value={formData.yourPhone}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                     />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="friend-name">My Friend's Name is *</label> {/* Added asterisk */}
                                    <input
                                        type="text"
                                        id="friend-name"
                                        name="friendName" // Matches state key
                                        placeholder="Enter your friend's Name"
                                        value={formData.friendName}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                </div>
                            </div>

                            {/* Row 3: Friend's Email / Friend's Phone */}
                            <div className="form-row form-row-split">
                                <div className="form-group">
                                    <label htmlFor="friend-email">My Friend's Email ID is *</label> {/* Added asterisk */}
                                    <input
                                        type="email"
                                        id="friend-email"
                                        name="friendEmail" // Matches state key
                                        placeholder="Enter your friend's Email"
                                        value={formData.friendEmail}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="friend-phone">My Friend's Phone Number *</label> {/* Added asterisk */}
                                    <input
                                        type="tel"
                                        id="friend-phone"
                                        name="friendPhone" // Matches state key
                                        placeholder="Enter your friend's Phone Number"
                                        value={formData.friendPhone}
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                </div>
                            </div>

                            {/* Row 4: Friend's Gender / Interested Location */}
                            <div className="form-row form-row-split">
                                <div className="form-group">
                                    <label htmlFor="friend-gender">My Friend's Gender *</label> {/* Added asterisk */}
                                    <select
                                        id="friend-gender"
                                        name="friendGender" // Matches state key
                                        value={formData.friendGender} // Controlled component
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    >
                                        <option value="" disabled>Choose Gender</option>
                                        {genderOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="interested-location">Interested Location *</label> {/* Added asterisk */}
                                    <select
                                        id="interested-location"
                                        name="interestedLocation" // Matches state key
                                        value={formData.interestedLocation} // Controlled component
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    >
                                        <option value="" disabled>Choose Interested Location</option>
                                        {locationOptions.map(option => <option key={option} value={option}>{option}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Row 5: Terms Agreement */}
                            <div className="form-row form-row-terms">
                                <div className="form-group-checkbox">
                                    <input
                                        type="checkbox"
                                        id="terms-agree"
                                        name="termsAgree" // Matches state key
                                        checked={formData.termsAgree} // Controlled component
                                        onChange={handleInputChange}
                                        required
                                        disabled={isSubmitting}
                                        aria-required="true"
                                    />
                                    <label htmlFor="terms-agree">
                                        I Agree to all <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions *</a> {/* Added asterisk */}
                                    </label>
                                </div>
                            </div>


                            {/* Row 6: Submit Button */}
                            <div className="form-row form-row-submit">
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={isSubmitting} // Disable while submitting
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Referral'}
                                </button>
                            </div>

                            {/* --- Feedback Area --- */}
                            {(submitError || submitSuccess) && (
                                <div className="form-row form-feedback-area" style={{ marginTop: '1rem' }}>
                                    {submitError && (
                                        <p className="form-feedback error" role="alert" style={{ color: 'red', width: '100%', textAlign: 'left' }}>
                                            {submitError}
                                        </p>
                                    )}
                                    {submitSuccess && (
                                        <p className="form-feedback success" role="status" style={{ color: 'green', width: '100%', textAlign: 'left' }}>
                                            Referral submitted successfully! Thank you.
                                        </p>
                                    )}
                                </div>
                             )}
                            {/* --- End Feedback Area --- */}

                        </form>
                    </div>
                    {/* --- End Form --- */}
                </div>
            </div>
            {/* End Referral Form Section */}

        </div>
    )
}