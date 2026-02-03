import React from 'react';
import './tof.scss'; // Styles for this component
import SectionTitle from '../SectionTitle/SectionTitle'; // Import the reusable title

// Define data for the cards
const unitTypes = [
  { title: "Single Room", img: "/images/single-room.jpeg" }, // Replace with actual image paths
  { title: "Twin Sharing", img: "/images/twin-room.jpeg" },
  { title: "4 - Sharing", img: "/images/four-sharing-room-image.jpeg" } // Using '4-Share' for consistency if it matches data
];

const TypeOfUnits = () => {
  return (
    <div className='tof-container-main flex items-center justify-center margin-bottom'> {/* Added margin-bottom */}
        <div className="tof-container container">
            <SectionTitle
              title="One Roof. Many Ways to Belong."
              subtext="Explore diverse room options, from cozy singles to vibrant shared spaces, and find your perfect fit at Hubode."
            />

           {/* Removed extra wrapper div */}
           <div className="tof-cards-container">
              {unitTypes.map((unit, index) => (
                <div
                  className="tof-card"
                  key={index}
                  style={{ backgroundImage: `url('${unit.img}')` }} // Apply backgrou inline
                >
                  {/* This div creates the glass effect and positions the text */}
                  <div className="card-content-overlay">
                    <h5>{unit.title}</h5>
                  </div>
                </div>
              ))}
            </div>
        </div>
    </div>
  );
};

export default TypeOfUnits;