import React from 'react';
import './kft.scss';

const KeyFtSection = () => {
  // Updated features array to include image paths
  const features = [
    { title: "Community Focused", img: "/images/kf1.png" }, // Replace with actual paths
    { title: "Flexible Living", img: "/images/kf2.jpg" },
    { title: "Custom Room Options", img: "/images/kf3.jpg" },
    { title: "Common Spaces", img: "/images/kf4.jpg" },
    { title: "Fully Furnished", img: "/images/kf5.png" },
    { title: "Prime Locations", img: "/images/kf6.jpg" }
  ];

  return (
    <div className='KeyFtSection-container-main flex items-center justify-center margin-top margin-bottom'>
        <div className="KeyFtSection-container container">
            <div className="left-section-container flex flex-col justify-center">
                <h2>More Than a Stay</h2>
                <h5>Welcome to Hubode, where every space feels like the home you wished for.</h5>
                <p>
                We’ve designed our living spaces for people who like a good mix of comfort and community. Whether you’re a student, a young professional, or just someone looking for a friendly place to stay,
                </p>
            </div>

            <div className="right-section-container feature-grid">
                {features.map((feature, index) => (
                  // Apply background image using inline style
                  <div className="feature-item"
                    key={index}
                    style={{ backgroundImage: `url('${feature.img}')` }} // Set unique background image
                  >
                    <div className="feature-overlay"></div>
                    <div className="feature-text-container">
                      <h6>{feature.title}</h6> {/* Use title from feature object */}
                    </div>
                  </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default KeyFtSection;