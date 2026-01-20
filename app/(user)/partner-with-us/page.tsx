import React from 'react'
import './style.scss'
import Button from '../components/Button/Button'
import SectionTitle from '../components/SectionTitle/SectionTitle'
import PartnerContactSection from './PartnerContactSection'


const stepsData = [
  { icon: "/images/property-owners.svg", iconAlt: "Room cleaning icon", title: "Property owners", text: "with hostels, PGs, or vacant buildings" },
  { icon: "/images/developers.svg", iconAlt: "Waste managed icon", title: "Developers", text: "seeking sustainable income models" },
  { icon: "/images/land-owners.svg", iconAlt: "Reward icon", title: "Landowners", text: "ready to scale with minimal hassle" },
    { icon: "/images/investors.svg", iconAlt: "Reward icon", title: "Investors", text: "seeking high and steady returns" },
    { icon: "/images/corporates.svg", iconAlt: "Reward icon", title: "Corporates & Institutions", text: "exploring housing and stay partnerships" },
    { icon: "/images/brand-collaborations.svg", iconAlt: "Reward icon", title: "Brand Collaborations", text: "building creative growth partnerships" },
    
];

const whatYouGainPoints = [
  "Guaranteed earnings with full flexibility, whether you prefer fixed rent or a shared revenue model.",
  "Property transformation led by a dedicated team",
  "Transparent terms with no middle-layer confusion",
  "Brand association with a fast-growing modern living brand",
];

const careItems = [
  {
    image: "/images/what-we-take-1.png",
    alt: "Cozy, well-designed shared living room",
    text: "Interior Design, Optimisation, Furnishing, and Branding",
  },
  {
    image: "/images/what-we-take-2.png",
    alt: "Team assisting a resident",
    text: "Day to day Operations and Resident Support",
  },
  {
    image: "/images/what-we-take-3.png",
    alt: "Facility management professional cleaning and maintaining spaces",
    text: "Security, Hygiene, and Facility Management",
  },
  {
    image: "/images/what-we-take-4.png",
    alt: "Smart access infrastructure for residents",
    text: "Complete service Infrastructure and Technology",
  },
]

const page = () => {
  return (
    <div className="partner-hero-page">
      <section className="hero-top">
        <div className="container">
          <div className="title-section">
            <h1>Transforming Assets into Growth Opportunities</h1>
            <p>
              From real estate to partnerships, we help maximise revenue through new amenities,
              dynamic pricing, and operational efficiency built around tenant satisfaction and
              long term value.
            </p>
            {/* <div className="btn-row">
              <Button
                text="Download Partner Deck"
                className="hero-btn hero-btn--ghost"
              />
              <Button
                text="Start a Partnership"
                className="hero-btn hero-btn--solid"
              />
            </div> */}
          </div>
        </div>
      </section>

      <section className="hero-visual">
        <div className="container">
          <div className="feature-card">
            <img
              src="/images/partner-with-hero-img.png"
              alt="Two people relaxing and working together in a shared space"
              className="feature-image"
            />
            <div className="feature-overlay">
              <h2>
                Hubode transforms existing properties into high demand residences built for today’s
                working and student lifestyles.
              </h2>
              <p>You bring the asset. We bring the design, systems, and consistent returns.</p>
            </div>
          </div>
        </div>
      </section>


    <div className="how-it-works-section-container flex items-center justify-center margin-bottom">
                <div className="how-it-works-section container">
                    <SectionTitle title="Our Ideal Partners" subtext="Find out if you’re the right match to partner with us" />
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


      <section className="what-you-gain-section-container flex items-center justify-center margin-bottom">
        <div className="what-you-gain-section container">
          <div className="left-section content-section">
            <h4>What You Gain</h4>
            <ul className="points-container">
              {whatYouGainPoints.map((point, index) => (
                <li key={point} className="point-item">
                  <span className="point-icon">
                    <img src="/images/check-white.svg" alt="Checked benefit" />
                  </span>
                  <p className="point-text">{point}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="right-section image-container">
            <img
              src="/images/huobde-roots.png"
              alt="Modern residential tower with lush greenery"
            />
          </div>
        </div>
      </section>


      <section className="what-we-take-care-of-container flex items-center justify-center margin-bottom">
        <div className="what-we-take-care-of-section container">
          <SectionTitle
            title="What We Take Care Of"
            subtext="No assembling. No last minute shopping. Just unlock and unpack."
          />
          <div className="care-grid">
            {careItems.map((item) => (
              <article className="care-card" key={item.text}>
                <div className="care-card__image">
                  <img src={item.image} alt={item.alt} />
                </div>
                <div className="care-card__text">
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PartnerContactSection />
    </div>
  )
}

export default page
