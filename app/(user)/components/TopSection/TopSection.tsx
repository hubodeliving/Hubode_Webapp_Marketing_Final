import React from 'react';
import './topsection.scss'; // Styles for this component

// Define the props interface
interface TopSectionProps {
  title: string;
  subtext: string;
  backgroundImageUrl: string; // URL for the background image
}

const TopSection: React.FC<TopSectionProps> = ({ title, subtext, backgroundImageUrl }) => {

  // CORRECTED background style with the gradient fading from left (dark) to right (transparent)
  const backgroundStyle = {
    backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.76) 0%, rgba(0, 0, 0, 0.2) 70%), url('${backgroundImageUrl}')`
    // Starts 76% black on the far left (0%)
    // Fades to fully transparent by 70% across the container
    // The original 99.91% stop for the dark color at 270deg was likely making the fade very abrupt near the right edge.
    // Adjust the 70% value if you want the fade to complete sooner or later.
  };

  return (
    <div>
        <div
      className='topsection-container-main flex margin-bottom items-center justify-center'
      style={backgroundStyle} // Apply dynamic background style here
    >
        <div className="topsection-container container">
            <div className="content-container">
                <h1>{title}</h1>
                <p>{subtext}</p>
            </div>
        </div>
    </div>

    </div>

  );
};

export default TopSection;