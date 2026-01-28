import React from 'react';
import './as.scss'; // Assuming styles are in as.scss in the same folder

// Define the props interface
interface AboutSectionProps {
  title: string;
  paragraph: string;
  imageUrl?: string;
  imageAlt?: string; // Optional alt text
  reverse?: boolean; // Optional prop to reverse layout
  showImage?: boolean;
}

const AboutSection: React.FC<AboutSectionProps> = ({
  title,
  paragraph,
  imageUrl,
  imageAlt = 'Descriptive image', // Default alt text
  reverse = false, // Default to false (text left, image right)
  showImage = true
}) => {

  const textContent = (
    <div className="content-section">
      <h3>{title}</h3>
      <p>{paragraph}</p>
    </div>
  );

  const imageContent = showImage && imageUrl ? (
    <div className="image-section">
      <img src={imageUrl} alt={imageAlt} />
    </div>
  ) : null;

  return (
    // You might already have these wrapper classes from your page structure
    <div className='about-section-container flex items-center justify-center margin-bottom'>
      <div className={`about-section container${showImage ? '' : ' text-only'}`}>
        {/* Conditionally render order based on the 'reverse' prop */}
        {reverse ? (
          <>
            {imageContent}
            {textContent}
          </>
        ) : (
          <>
            {textContent}
            {imageContent}
          </>
        )}
      </div>
    </div>
  );
};

export default AboutSection;
