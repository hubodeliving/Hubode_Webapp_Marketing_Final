import React from 'react';
import './hubodsteps.scss'; // Styles for this component

// Data for the steps
const stepsData = [
  {
    id: 1,
    iconSrc: "/images/3step1.png", // Render lightweight raster assets
    title: "Book your place",
    text: "Find a spot that suits your style and needs."
  },
  {
    id: 2,
    iconSrc: "/images/3step2.png", // Placeholder icon (replace with actual later)
    title: "Walk in & Feel at Home",
    text: "We handle the details, so you can focus on what really matters."
  },
  {
    id: 3,
    iconSrc: "/images/3step3.png", // Placeholder icon (replace with actual later)
    title: "Live and Thrive",
    text: "Sign up and check out our spaces & community."
  }
];

const HubodeSteps = () => {
  return (
    // Added -main suffix and margin-bottom class
    <div className='hubode-steps-container-main flex items-center justify-center margin-bottom'>
        {/* This inner container gets the dark background and padding */}
        <div className="hubode-steps container">
            <div className="heading-section">
                <h3>How Hubode Holds It Up</h3>
                <p>In 3 Simple Steps</p>
            </div>

            <div className="steps-icon-container">
                {stepsData.map(step => (
                  <div className="hubode-step-item" key={step.id}>
                      <div className="hubode-step-icon">
                        {/* Use the icon source from the data */}
                        <img src={step.iconSrc} alt="" />
                      </div>
                      <h6>{step.title}</h6>
                      <p>{step.text}</p>
                  </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default HubodeSteps;
