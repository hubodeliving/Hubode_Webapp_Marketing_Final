"use client" // Needed for useState
import React, { useState } from 'react'; // Import useState
import './style.scss'; // Keep original import
import TopSection from '../components/TopSection/TopSection';
import Lightbox from '../components/LightBox/LightBox'; // Ensure correct path casing
import Button from '../components/Button/Button'; // Import Button if used

// Example Image Data (Kept original)
const allGalleryImages = [
  { src: "/images/gallery-featured.png", alt: "Featured Room View" }, // Featured image first
  { src: "/images/gallery-1.png", alt: "Room detail 1" },
  { src: "/images/gallery-2.png", alt: "Common area" },
  { src: "/images/gallery-3.png", alt: "Bunk beds" },
  { src: "/images/gallery-4.png", alt: "Group activity" },
  { src: "/images/gallery-5.png", alt: "Another view" }, // Additional images for lightbox...
  { src: "/images/gallery-6.png", alt: "Kitchen area" },
  // ... Add up to 24 images total if needed
];

// Data for the Page (Kept original)
// Data for the Page (Updated Description)
const pageData = {
  title: "Hubode Roots: Your Ideal Sanctuary",
  subtext: "Discover a comfortable and welcoming living space designed for your needs, where community and convenience come together at Hubode Roots.",
  heroImage: "/images/hubode-roots-hero.png",
  propertyName: "Hubode Roots",
  location: "Hubode Roots, Eranhipalam Junction, Kozhikode, Kerala",
  roomTypes: ["Single", "Twin", "4 Sharing"],
  // <<< START: Longer Description >>>
  description: "Hubode Roots offers a vibrant and comfortable living environment designed specifically for young women, combining modern amenities with a strong sense of community. Nestled in a prime location, our property features thoughtfully designed single, double, and shared rooms that cater to various lifestyles and preferences. Residents can enjoy a range of facilities, including communal lounges, dedicated study areas perfect for focusing, high-speed internet access throughout the property, convenient on-site laundry services, and robust 24/7 security measures, ensuring a safe, comfortable, and productive stay. Furthermore, engage with fellow residents in our planned weekly events or relax in the common pantry area. Experience the perfect blend of privacy, social interaction, and essential amenities designed to make your transition smooth and enjoyable. We strive to create more than just housing; we aim to build a supportive network where everyone feels empowered to pursue their goals.",
  // <<< END: Longer Description >>>
  priceFrom: "4,500",
  priceDescription: "Choose your room type and pay the reservation fee to confirm your booking.",
};

// Amenities Data (Kept original)
const amenitiesData = [
    { icon: '/images/offering.svg', text: 'Laundry Service' },
    { icon: '/images/offering.svg', text: 'Air Conditioned Rooms' },
    { icon: '/images/offering.svg', text: 'Television Area' },
    { icon: '/images/offering.svg', text: 'Electric Kettle' },
    { icon: '/images/offering.svg', text: 'Common Pantry' },
    { icon: '/images/offering.svg', text: 'Elevator Access' },
    { icon: '/images/offering.svg', text: 'High-Speed Wi-Fi' },
    { icon: '/images/offering.svg', text: 'Power Backup' },
    { icon: '/images/offering.svg', text: '24/7 Security' },
    { icon: '/images/offering.svg', text: 'Parking Available' },
    { icon: '/images/offering.svg', text: 'Regular Housekeeping' },
];
const initialVisibleAmenities = 8;

const sharedSpacesData = [
    { image: "/images/shared-spaces.png", title: "Play Area" },
    { image: "/images/shared-spaces.png", title: "Co Working Space" },
    { image: "/images/shared-spaces.png", title: "Cafe" },
    { image: "/images/shared-spaces.png", title: "Co Working Space" },
];

// Location Access Data (Kept original)
const locationAccessData = [
    { text: "9.6 Km from Hi Lite Mall" }, { text: "3.8 Km Puthiya Stand" },
    { text: "9.6 Km from Hi Lite Mall" }, { text: "3.8 Km Puthiya Stand" },
    { text: "9.6 Km from Hi Lite Mall" }, { text: "3.8 Km Puthiya Stand" },
    { text: "9.6 Km from Hi Lite Mall" }, { text: "3.8 Km Puthiya Stand" },
];

// Room Type Data Structure (Kept original)
const roomTypeData = {
    "Single": [
        { tier: "Standard", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
        { tier: "Ensuite", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
        { tier: "Premium", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
    ],
    "Twin": [
        { tier: "Standard", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
        { tier: "Ensuite", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
        { tier: "Premium", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
    ],
    "4 Sharing": [
        { tier: "Standard", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
        { tier: "Ensuite", image: "/images/hubode-roots-room.png", features: "Private Bathroom • Modern Furnishings Air Conditioning • Spacious Design", price: 8000, bedsLeft: 3 },
    ]
};




const Page = () => { // Keep original component name convention
  // State (Kept original)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxStartIndex, setLightboxStartIndex] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);


  // Functions (Kept original)
  const openLightbox = (index: number) => { setIsLightboxOpen(true); setLightboxStartIndex(index); };
  const closeLightbox = () => { setIsLightboxOpen(false); };
  const toggleDescription = () => { setIsDescriptionExpanded(!isDescriptionExpanded); };
  const toggleAmenitiesView = () => { setShowAllAmenities(!showAllAmenities); };


  // Derived State (Kept original)
  const amenitiesToShow = showAllAmenities ? amenitiesData : amenitiesData.slice(0, initialVisibleAmenities);
  const featuredImage = allGalleryImages[0];
  const gridImages = allGalleryImages.slice(1, 5);

  return (
    // Keep original outer structure
    <div>
      <TopSection
        title={pageData.title}
        subtext={pageData.subtext}
        backgroundImageUrl={pageData.heroImage}
      />

      {/* Keep original Image Gallery Section */}
      <div className="images-container-main flex items-center justify-center">
        <div className="images-container container">
          {/* Left Section */}
          <div className="left-section"> {featuredImage && ( <div className="featured-image img-item" onClick={() => openLightbox(0)}> <img src={featuredImage.src} alt={featuredImage.alt} /> </div> )} </div>
          {/* Right Section */}
          <div className="right-section"> {gridImages.map((image, index) => ( <div className={`image img-item image${index + 1}`} key={image.src} onClick={() => openLightbox(index + 1)} > <img src={image.src} alt={image.alt} /> {index === gridImages.length - 1 && ( <div className="all-image-icon" onClick={(e) => {e.stopPropagation(); openLightbox(index + 1);}}> <img src="/images/camera-white.svg" alt="Gallery icon" /> <span>{allGalleryImages.length}</span> </div> )} </div> ))} </div>
        </div>
      </div>

      {/* Keep original --- Main Content Area --- */}
      <div className="main-content-container-outer flex items-center justify-center margin-bottom">
        <div className="main-content-container container">
          {/* Keep original Left Content Section */}
          <div className="left-content-section">
              {/* Keep original Property Title and Details */}
              <div className="head-section">
                <div className="property-header"> <h1>{pageData.propertyName}</h1> <button className="share-button"> <img src="/images/share-icon-white.svg" alt="Share"/> Share </button> </div>
                <div className="property-location detail-row"> <img src="/images/location-green.svg" alt="Location"/> <p>{pageData.location}</p> </div>
                <div className="property-room-types detail-row"> {pageData.roomTypes.map((type) => { let iconSrc = "/images/single-icon.svg"; if (type === "Twin") iconSrc = "/images/double-icon.svg"; if (type === "4 Sharing") iconSrc = "/images/4-icon.svg"; return ( <div className="type" key={type}> <img src={iconSrc} alt={`${type} icon`} /> <p>{type}</p> </div> ); })} </div>
              </div>

              {/* Keep original Description */}
              {/* Keep original Description Section Structure */}
<div className="description-section">
  <h4>Description</h4>
  {/* This paragraph now uses the longer description */}
  <p className={`description-text ${isDescriptionExpanded ? 'expanded' : ''}`}>
    {pageData.description}
  </p>
  {/* Read More button logic remains the same */}
  <button onClick={toggleDescription} className="read-more-button">
    Read {isDescriptionExpanded ? 'Less' : 'More'}
    <img src="/images/down-arrow-green.svg" alt="" className={`arrow ${isDescriptionExpanded ? 'up' : ''}`}/>
  </button>
</div>

              {/* Keep original Features / Amenities Section */}
              <div className={`description-section features-section ${showAllAmenities ? 'expanded' : ''}`}>
                <h4>Features / Amenities</h4>
                <div className="features-items-container"> {amenitiesToShow.map((amenity) => ( <div className="feature-item" key={amenity.text}> <div className="feature-icon-container"> <img src={amenity.icon} alt={`${amenity.text} icon`} className="feature-icon"/> </div> <p>{amenity.text}</p> </div> ))} </div>
                {amenitiesData.length > initialVisibleAmenities && ( <button onClick={toggleAmenitiesView} className="view-all-amenities-button"> {showAllAmenities ? 'View Less' : 'View All'} </button> )}
              </div>

               {/* Keep original Location Access Section */}
               <div className="description-section location-access-section">
                  <h4>Location Access</h4>
                  <div className="locations-container"> {locationAccessData.map((location, index) => ( <div className="location-item" key={index}> <img src="/images/pin-green.svg" alt="Location pin icon" /> <p>{location.text}</p> </div> ))} </div>
                </div>

               {/* Keep original Room Types Section */}
               <div id="room-types" className="description-section roomtype-section">
                  <h4>Room Type</h4>
                   {pageData.roomTypes.map((occupancyType) => (
                       <div className={`roomtype-group ${occupancyType.toLowerCase().replace(' ','-')}-group`} key={occupancyType}>
                            <h5 className="roomtype-group-heading">{occupancyType}</h5>
                            <div className="roomtype-row">
                                {roomTypeData[occupancyType as keyof typeof roomTypeData]?.map((tier) => (
                                    <div className="roomtype-item" key={`${occupancyType}-${tier.tier}`}>
                                        <div className="roomtype-item-image"> <img src={tier.image} alt={`${occupancyType} - ${tier.tier} room`} /> </div>
                                        <div className="roomtype-item-content"> <h6 className='roomtype-item-title'><span>{occupancyType}</span> - {tier.tier}</h6> <p className='room-features'>{tier.features}</p> <p className="price"> <span>₹{tier.price.toLocaleString('en-IN')}</span> / month </p> <p className="beds-left">{tier.bedsLeft} Beds Left</p> <button className="select-button">Select</button> </div>
                                    </div>
                                ))}
                            </div>
                       </div>
                   ))}
                </div>

               {/* Keep original Location Map Section */}
               <div className="description-section location-map">
                    <h4>Location</h4>
                    <div className="map-container">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3912.6955837389587!2d75.78076287577207!3d11.2837732496293!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba65ec77ae662ed%3A0xb1559cb1b6907db!2sAshirvad%20Lawns%20-%20Convention%20Centre!5e0!3m2!1sen!2sin!4v1745732959408!5m2!1sen!2sin"
                            width="600" height="450" style={{ border: 0 }} allowFullScreen={true} loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade" title={`${pageData.propertyName} Location Map`}
                        ></iframe>
                    </div>
               </div>

               {/* Keep original Shared Spaces Section */}
               <div className="description-section shared-spaces-container">
                    <h4>Shared Spaces</h4>
                    <p> Hubode’s shared spaces encourage community and collaboration, offering comfortable lounges, study areas, and dining zones. Experience a welcoming environment where residents can connect and relax together. </p>
                    <div className="shared-items-container">
                        {sharedSpacesData.map((space, index) => (
                            <div className="shared-item" key={index} style={{ backgroundImage: `url(${space.image})` }} >
                                <p>{space.title}</p>
                            </div>
                        ))}
                    </div>
                </div>

          </div>

          {/* Keep original Right Sticky Section */}
          <div className="right-sticky-section">
            <div className="roomtype-cta-container">
              <div className="price"> <p>From <span>₹{pageData.priceFrom}</span> /month</p> </div>
              <p className="cta-subtext">{pageData.priceDescription}</p>
              <Button text="Choose Room Type" href="#room-types" className="cta-button"/>
            </div>
          </div>


        </div>
      </div>
      {/* --- End Main Content Area --- */}


      {/* Keep original Conditionally render the Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          images={allGalleryImages}
          startIndex={lightboxStartIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

export default Page; // Keep original exportsdfsf
