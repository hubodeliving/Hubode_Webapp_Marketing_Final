// File: components/TextImageSection/TextImageSection.tsx
import React from 'react';
import Image from 'next/image'; // Using Next/Image for optimization
import './style.scss'; // We'll create this SCSS file

interface TextImageSectionProps {
  title: string;
  subtext1: string; // Text directly below the title
  subtext2: string; // Text after the "line" or main paragraph
  imageUrl: string;
  imageAlt: string;
  reverseLayout?: boolean; // Optional prop to reverse layout
  imagePriority?: boolean; // Optional prop for Next/Image priority
}



const TextImageSection: React.FC<TextImageSectionProps> = ({
  title,
  subtext1,
  subtext2,
  imageUrl,
  imageAlt,
  reverseLayout = false, // Default to image on left, text on right
  imagePriority = false,
}) => {
  return (
    <div className={`text-image-section-main flex items-center justify-center margin-bottom`}>
      <div className={`text-image-section-container container ${reverseLayout ? 'layout-reversed' : ''}`}>

        {/* Image Section */}
        <div className="image-content-wrapper image-wrapper">
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={600} // Example base width, adjust as needed or use fill
            height={400} // Example base height
            style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block' }} // Responsive styles
            priority={imagePriority}
            className="section-image" // Class for specific image styling
            sizes="(max-width: 768px) 100vw, 50vw" // Example sizes
          />
        </div>

        {/* Text Content Section */}
        <div className="text-content-wrapper text-wrapper">
          <h2>{title}</h2>
          <p className="subtext subtext-main">{subtext1}</p> {/* First paragraph of text */}
          {/* Optional: If you want a visual separator or more distinct gap for the second subtext */}
          {/* <hr className="text-separator" /> */}
          <p className="subtext subtext-secondary">{subtext2}</p> {/* Second paragraph of text */}
        </div>

      </div>
    </div>
  );
};

export default TextImageSection;