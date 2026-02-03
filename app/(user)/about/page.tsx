import React from 'react'
import './style.scss'
import TopSection from '../components/TopSection/TopSection'
import AboutSection from '../components/AboutSection/AboutSection'
import SectionTitle from '../components/SectionTitle/SectionTitle'

const page = () => {

    // Placeholder data for the 4 core value cards
// (Using identical content as requested for now)
const coreValuesData = [
    {
        icon: "/images/core-icon1.png", // Use the requested placeholder icon
        iconAlt: "Presence Over Pretence",
        title: "Presence Over Pretence",
        text: "We don’t fake it. Every space we create is lived-in, loved, and made for real life, experience and find an abode by creating spaces."
    },
    {
        icon: "/images/core-icon2.png",
        iconAlt: "Built for Belonging",
        title: "Built for Belonging",
        text: "We’re not in the business of housing, we’re building communities. Everyone has a place here."
    },
    {
        icon: "/images/core-icon3.png",
        iconAlt: "Rooted and Relevant",
        title: "Rooted and Relevant",
        text: "Inspired globally. Grounded locally. We listen before we build, and build for who’s really living here."
    },
    {
        icon: "/images/core-icon4.png",
        iconAlt: "Grow, Together",
        title: "Grow, Together",
        text: "Whether it’s your first job, side hustle, or late night brainstorm, we create space for your next step."
    }
];


  return (
    <div>
        <TopSection title="Hubode. A Place to Be."
        subtext="It’s where people come not just to stay but to grow."
        backgroundImageUrl='/images/about-cover-image.png'
        />

<AboutSection
    title="Why Do We Exist? Because…"
    paragraph="Not everyone fits in a flat.
Not everyone thrives in a hostel.
And not everyone needs another overpriced studio.
Hubode is for the in-betweeners. The makers, thinkers, interns, creatives, coders, and coffee-after-midnight types. 
We built this so you can live fully for 30 days at a time.
"
    imageUrl="/images/abt-img-card1.png" // Use the correct image path
    imageAlt="Comfortable modern room with bed and desk"
/>

<AboutSection
    title="Our Mission"
    paragraph="To reshape how people experience shared living by creating spaces that honour individuality, spark connection, and offer peace without compromise.
We exist to replace chaos with calm, transactions with trust, and isolation with an honest community.
"
    showImage={false}
/>

<AboutSection
    title="Our Vision"
    paragraph="To revolutionise urban living by building a smart, connected ecosystem where everyone finds a Hubode - wherever they go."
    showImage={false}
/>

    <div className="our-core-values-section-container flex items-center justify-center margin-bottom">
        <div className="our-core-values-section container">
<SectionTitle
title="Our Core Values"
subtext="At Hubode, our core values of safety, community, diversity, and personal growth drive us to create a supportive environment where every resident can thrive."
/>

<div className="our-core-values-section-container"> {/* Optional wrapper */}
    <div className="our-core-values-section container"> {/* Optional inner container */}

        {/* Assuming SectionTitle component is rendered above this */}

        <div className="our-core-values-cards-container">
            {coreValuesData.map((value, index) => (
                <div className="core-value-item" key={index}>
                    <div className="icon-container">
                        <img src={value.icon} alt={value.iconAlt} />
                    </div>
                    <h5 className="core-val-title">{value.title}</h5>
                    <p>{value.text}</p>
                </div>
            ))}
        </div>

    </div>
</div>
        </div>
    </div>

    {/* ==================================================== */}
{/* START: Founders Section                              */}
{/* ==================================================== */}
<div className="founders-cards-section-container flex items-center justify-center margin-bottom">
    <div className="founders-cards-section container">
        <SectionTitle title="Men Who Dared to Question" />

        <div className="founders-cards-container">
            {/* --- Founder Card 1 --- */}
            <div className="founder-item">
                <div className="left-section image-section">
                    {/* Replace with actual image path and alt text */}
                    <img src="/images/founder-arshak.png" alt="Arshak Muhammed Anvar" />
                </div>
                <div className="right-section content-section">
                    <div className="title-with-linkedin">
                        <div>
                            <h3>Arshak Anvar</h3>
                            <p className="designation">
                                Founder | CEO
                            </p>
                        </div>
                        <a
                          className="linkedin-icon"
                          href="https://www.linkedin.com/in/arshakanvar/"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Connect with Arshak Muhammed Anvar on LinkedIn"
                        >
                            <img src="/images/linkedin-icon-grey.png" alt="LinkedIn icon" />
                        </a>
                    </div>
                    <a
                      className="email-link"
                      href="mailto:ceo@hubodeliving.com"
                      aria-label="Email Arshak Muhammed Anvar"
                    >
                        ceo@hubodeliving.com
                    </a>
                    {/* Use ul for the bulleted list for semantic correctness */}
                    <ul className="content-list">
                        <li>"A different concept of accommodation, that could meet young India’s growing needs"</li>
                        <li>Earned a degree in Accounting and Finance, with 7 years of experience in the UK, including three years in hospitality management and business development</li>
                        <li>Entrepreneurial problem solver driven to build connected, purpose-driven living spaces inspired by international communities</li>
                    </ul>
                </div>
            </div>

            {/* --- Founder Card 2 --- */}
            <div className="founder-item">
                <div className="left-section image-section">
                    {/* Replace with actual image path and alt text */}
                    <img src="/images/founder-shehzad.png" alt="CS Shehzad KV" />
                </div>
                <div className="right-section content-section">
                    <div className="title-with-linkedin">
                        <div>
                            <h3>CS Shehzad KV</h3>
                            <p className="designation">
                                Co-Founder | COO
                            </p>
                        </div>
                        <a
                          className="linkedin-icon"
                          href="https://www.linkedin.com/in/cs-shehzad-kv-0353b1298/"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Connect with CS Shehzad KV on LinkedIn"
                        >
                            <img src="/images/linkedin-icon-grey.png" alt="LinkedIn icon" />
                        </a>
                    </div>
                    <a
                      className="email-link"
                      href="mailto:coo@hubodeliving.com"
                      aria-label="Email CS Shehzad KV"
                    >
                        coo@hubodeliving.com
                    </a>
                    <ul className="content-list">
                        <li>“A strong on-the-ground view to turn real accommodation needs into a sustainable business”</li>
                        <li>Qualified as a Company Secretary, with two years of experience in Corporate Legal sector</li>
                        <li>Strong foundation in corporate governance, legal compliance, and strategic business planning</li>
                    </ul>
                </div>
            </div>
            {/* Add more founder-item divs here if needed */}

        </div> {/* End founders-cards-container */}
    </div> {/* End founders-cards-section container */}
</div> {/* End founders-cards-section-container-main */}
{/* ================================================== */}
{/* END: Founders Section                                */}
{/* ================================================== */}


            {/* ==================================================== */}
{/* START: Founders Story Section                        */}
{/* ==================================================== */}
        <div className="founders-story-section-container flex items-center justify-center margin-bottom">
            <div className="founders-story-section container">
                <SectionTitle title="And the Answer They Found - Hubode" />

                <div className="content-container">
                    <p className="intro-text">
                        It all began with a quiet question in an Apartment in London:
                        <span className="quote-text">“If I had studied in India… where would I have stayed?”</span>
                    </p>

                    <p>
                        Arshak had spent seven years in the UK, studying, working, travelling and absorbing what good community living truly felt like. It was more than beds and bills. It was support, freedom, and a sense of home. Motivated to learn more, he travelled across Europe, exploring how coliving thrived in different cultures. At its core, it was about connection, bringing people, ideas, and purpose together. He knew something like that was missing back home. So, he quit his job and returned with a mission.
                    </p>

                    <p>
                        Back home, he reached out to his childhood friend, Shehzad, a qualified Company Secretary and a grounded realist with a sharp eye for business and legal framework. While Arshak dreamed up possibilities, Shehzad helped keep the blueprint real. Together, they balanced vision with logic, heart with structure. Together, they shaped an idea into something tangible something personal.
                    </p>

                    <p className="highlight-text">
                        That’s how Hubode was born.
                    </p>

                    <p className="outro-text">
                        A home for those who want more than just a place to stay. A space to grow, belong, and live completely.
                    </p>
                </div>
            </div>
        </div>
{/* ================================================== */}
{/* END: Founders Story Section                          */}
{/* ================================================== */}


    </div>
  )
}

export default page
