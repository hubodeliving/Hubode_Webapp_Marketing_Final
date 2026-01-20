import React from 'react';
import './st.scss'; // Import the styles associated with this component

// Define the expected props for the component
interface SectionTitleProps {
  title: string;      // The main heading text (required)
  subtext?: string;   // The paragraph text below the heading (optional)
}

// Create the functional component using the props interface
const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtext }) => {
  return (
    // Use the same wrapper div and classes as before
    <div className="heading-container flex flex-col items-center justify-center">
        <div className="heading-container-inside">
          {/* Render the title prop inside the h3 tag */}
        <h3>{title}</h3>
        {subtext && (
          <p>
            {/* Render the subtext prop inside the p tag */}
            {/* Using ' for apostrophe if needed, or just the string */}
            {subtext}
          </p>
        )}
        </div>
    </div>
  );
};

export default SectionTitle;