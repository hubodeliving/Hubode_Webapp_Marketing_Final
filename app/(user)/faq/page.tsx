import React from 'react';
import './style.scss'; // Keep original import
import FaqSectionAll from '../components/FaqSectionAll/FaqSectionAll';


export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds


const Page = () => { // Use PascalCase for component name

  

  return (
    // Using the existing main class name for consistency, added 'faq-hero' for clarity if needed later
    <div>
        <div className='topsection-container-main faq-hero flex margin-bottom items-center justify-center'>
        <div className="topsection-container container"> {/* This holds the text */}
            <div className="content-container">
                <h1>Meet Homey Who’ll Answer your Doubts</h1>
            </div>
        </div>
        {/* Mascot Image - Its position will now be controlled by flex order on mobile */}
        <img
            src="/images/faq-mascot.gif"
            alt="Homie Mascot"
            className="faq-mascot"
        />
        </div>

    <FaqSectionAll />
    </div>
    // You might have other page content below this div
  );
};

export default Page; // Use PascalCase for component name