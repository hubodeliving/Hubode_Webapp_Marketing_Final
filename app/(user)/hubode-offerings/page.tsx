import React from 'react'
import './style.scss'
import TextImageSection from '../components/OfferingFtSection/OfferingFtSection'
import SectionTitle from '../components/SectionTitle/SectionTitle';

const safetyFeatures = [
  {
    icon: "/images/biometric-offering.svg",
    iconAlt: "Gated, biometric and key card access icon",
    text: "Three-layer security: Gated entry, Biometric verification and Key Card room access",
  },
  {
    icon: "/images/support-offering.svg",
    iconAlt: "Headset icon for support",
    text: "24/7 Support & In House Community Manager",
  },
  {
    icon: "/images/cctv-offering.svg",
    iconAlt: "CCTV camera icon",
    text: "360° CCTV with manned surveillance",
  },
];


const unitTypes = [
    { title: "Fully made Comfy beds, Roomy storage", img: "/images/comfy-bed.png" }, // Replace with actual image paths
    { title: "Study desks with Dedicated sockets", img: "/images/study-desks.png" },
    { title: "Thoughtful Shared and Single spaces that feel like home", img: "/images/shared-spaces-fc.png" } // Using '4-Share' for consistency if it matches data
  ];

  // --- Data (Keep as is) ---
const stepsData = [
  { icon: "/images/room-cleaning-icon.svg", iconAlt: "Room cleaning icon", title: "Room Cleaning & Linen Changing", text: "before you think about it" },
  { icon: "/images/waste-managed-icon.svg", iconAlt: "Waste managed icon", title: "Waste managed", text: "like clockwork" },
  { icon: "/images/spotless-clean-icon.svg", iconAlt: "Reward icon", title: "Property kept Spotless", text: "you chill, we clean. simple." }
];

const stepsData2 = [
  { icon: "/images/refer-step1.svg", iconAlt: " Pick your room and dates icon", title: " Pick your room and dates", text: "" },
  { icon: "/images/refer-step2.svg", iconAlt: "Pay a small deposit icon", title: "Pay a small deposit", text: "like clockwork" },
  { icon: "/images/refer-step3.svg", iconAlt: "Move in with no surprise charges later icon", title: "Move in with no surprise charges", text: "You chill, we clean. Simple.  " }
];


const page = () => {
  return (
    <div>
        <div className='topsection-container-main faq-hero flex margin-bottom items-center justify-center'>
        <div className="topsection-container container"> {/* This holds the text */}
            <div className="content-container">
                <h1>Hubode Offerings</h1>
            </div>
        </div>
        {/* Mascot Image - Its position will now be controlled by flex order on mobile */}
        <img
            src="/images/faq-mascot.gif"
            alt="Homie Mascot"
            className="faq-mascot"
        />
        </div>

        {/* ==================================================== */}
{/* START: Safety That Feels Like Home Section           */}
{/* ==================================================== */}
<div className="safety-feels-like-container-main flex items-center justify-center margin-bottom">
    <div className='safety-feels-like-container container'> {/* Using 'container' for max-width and centering */}

        {/* Left Content Section */}
        <div className="safety-copy-column">
            <div className="safety-heading-group">
                <h2 className="section-title">Safety That Feels Like Home</h2>
                <p className="section-subtitle">
                    Peace of mind isn’t optional.
                </p>
            </div>

            <div className="feature-list">
                {safetyFeatures.map((feature, index) => (
                    <div className="feature-item" key={index}>
                        <span className="feature-icon">
                            <img src={feature.icon} alt={feature.iconAlt} />
                        </span>
                        <p>{feature.text}</p>
                    </div>
                ))}
            </div>

            <div className="prime-block">
                <h3 className="prime-title">Prime Spots, Zero Compromises</h3>
                <p className="prime-subtitle">
                    Hubode homes are right where you need the close to colleges, offices, cafes, and the city buzz.
                </p>
                <p className="prime-description">
                    No more long rides or sketchy shortcuts. Just step out and go.
                </p>
            </div>
        </div> {/* End safety-copy-column */}

        {/* Right Image Section */}
        <div className="safety-image-column">
            <img src="/images/prime-spots-zero-compermises.png" alt="City skyline with location pin" />
        </div> {/* End safety-image-column */}

    </div> {/* End safety-feels-like-container */}
</div> {/* End safety-feels-like-container-main */}
{/* ================================================== */}
{/* END: Safety That Feels Like Home Section             */}
{/* ================================================== */}

<div className='tof-container-main flex items-center justify-center margin-bottom'> {/* Added margin-bottom */}
        <div className="tof-container container">
            <SectionTitle
              title="Fully Set to Settle In"
              subtext="No assembling. No last-minute shopping. Just unlock and unpack."
            />

           {/* Removed extra wrapper div */}
           <div className="tof-cards-container">
              {unitTypes.map((unit, index) => (
                <div
                  className="tof-card"
                  key={index}
                  style={{ backgroundImage: `url('${unit.img}')` }} // Apply background image inline
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


    <div className="how-it-works-section-container flex items-center justify-center margin-bottom">
                <div className="how-it-works-section container">
                    <SectionTitle title="Clean Spaces, Clear Minds" subtext="We take hygiene seriously because calm doesn’t come with clutter." />
                    <p className='sub-bold'>You focus on living. We’ll handle the rest.</p>
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


    <TextImageSection
  title="Your Kind of Kitchen"
  subtext1="We’ve got your meals covered breakfast, lunch & dinner. Want it daily? Just ask."
  subtext2="Prefer to do your own thing? Head to the pantry and cook up something solo or with your favorite humans. Either way, good food is always on the table. And yes, it’s a great excuse to network too."
  imageUrl="/images/Hubdoe-kitchen.png" // Use the correct image path
  imageAlt="Hubdoe-kitchen Image"
  reverseLayout={true}

  // reverseLayout={true} // Uncomment this to put image on right, text on left
/>

<div className="how-it-works-section-container flex items-center justify-center margin-bottom how-it-works-2">
                <div className="how-it-works-section container">
                    <SectionTitle title="Booking, Minus the Headache" subtext="No shady listings. No middlemen. No guesswork.
Just three simple steps" />
                    <p className='sub-bold'>First come, first served. All clear, all fair.</p>
                    <div className="steps-cards-container">
                        {stepsData2.map((step, index) => (
                            <div className="step-item" key={index}>
                                <div className="icon-container"><img src={step.icon} alt={step.iconAlt} /></div>
                                <h5 className="step-title">{step.title}</h5>
                            </div>
                        ))}
                    </div>
                </div>
    </div>


    
    </div>


    
  )
}

export default page


//sdfsdf
