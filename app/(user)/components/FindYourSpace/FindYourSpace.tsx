  // File: components/FindYourSpace/FindYourSpace.tsx

  import React from 'react'; // No useState/useEffect needed if Server Component
  import './findyourspace.scss';
  import SectionTitle from '../SectionTitle/SectionTitle';
  import Link from 'next/link';
  import groq from 'groq';
  import { client } from '@/lib/sanity.client'; // <<< ADJUST PATH if needed
  import urlBuilder from '@sanity/image-url';

  export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds

  // --- Helper Function for Sanity Image URL ---
  function urlFor(source: any) {
      if (!source?.asset) return ''; // Handle cases where source or asset might be missing
      return urlBuilder(client).image(source).auto('format').fit('max').url();
  }

  // --- TypeScript Interface for Fetched Property Card Data ---
  interface PropertyCardData {
      _id: string;
      propertyName: string;
      featuredImage: { // Structure matches GROQ projection
          alt?: string;
          asset: { _ref: string; url?: string };
      };
      locationName: string | null; // Name fetched from referenced location
      roomTypeNames: string[];     // Array of occupancy names
      roomTypes?: Array<{
        tiers?: Array<{
          pricePerMonth?: number | null;
          bunkPricing?: {
            upperBunkPrice?: number | null;
            lowerBunkPrice?: number | null;
          };
          sqftOptions?: Array<{
            pricePerMonth?: number | null;
          }>;
        }>;
      }>;
      priceFrom: string;
      slug: string;                // Property slug for linking
      markAsComingSoon?: boolean;  // Optional: disables click when true
      bedCount?: string | null;
      bedPostText?: string | null;
  }

  // --- GROQ Query to fetch latest 4 published properties ---
  const latestPropertiesQuery = groq`
    *[_type == "property" && published == true] | order(_createdAt desc) [0...4] {
      _id,
      propertyName,
      featuredImage {alt, asset->{_ref, url}},
      "locationName": linkedLocation->name, // Fetch name from referenced location
      "roomTypeNames": roomTypes[].occupancyName, // Get only the names
      roomTypes[]{
        tiers[]{
          pricePerMonth,
          bunkPricing{upperBunkPrice, lowerBunkPrice},
          sqftOptions[]{pricePerMonth}
        }
      },
      bedCount,
      bedPostText,
      priceFrom,
      "slug": slug.current, // Get the current slug value
      markAsComingSoon
    }
  `;

  // --- Static Data (Keep for icon mapping) ---
const typeIconMap: { [key: string]: string } = {
  "Single": "/images/single-icon.svg",
  "Duo": "/images/double-icon.svg",
  "Twin": "/images/double-icon.svg",
  "4 Sharing": "/images/4-icon.svg",
  // Add more mappings if needed
};

  // Function to generate CSS class (Keep original)
  const generateTypeClassName = (type: string): string => {
    let className = type.toLowerCase()
      .replace(/\b4\b/g, 'four') // Replace number 4 with 'four'
      .replace(/\s+/g, '-');    // Replace spaces with hyphens
    return `${className}-icon`;
  };

  const getLowestTierPrice = (property: PropertyCardData): number | null => {
    const prices: number[] = [];
    property.roomTypes?.forEach((group) => {
      group.tiers?.forEach((tier) => {
        if (typeof tier.pricePerMonth === 'number') prices.push(tier.pricePerMonth);
        if (typeof tier.bunkPricing?.upperBunkPrice === 'number') prices.push(tier.bunkPricing.upperBunkPrice);
        if (typeof tier.bunkPricing?.lowerBunkPrice === 'number') prices.push(tier.bunkPricing.lowerBunkPrice);
        tier.sqftOptions?.forEach((option) => {
          if (typeof option?.pricePerMonth === 'number') prices.push(option.pricePerMonth);
        });
      });
    });
    return prices.length ? Math.min(...prices) : null;
  };

  // --- The Component (Async for Server-Side Fetching) ---
  const FindYourSpace = async () => {

    // Fetch data directly (Server Component pattern)
    let properties: PropertyCardData[] = [];
    let fetchError: string | null = null;

    try {
      properties = await client.fetch(latestPropertiesQuery);
    } catch (error) {
      console.error("Failed to fetch latest properties:", error);
      fetchError = "Could not load properties at this time.";
      // Handle error state appropriately, maybe return an error message component
    }

    // Determine grid class based on fetched data length
    const propertyCount = properties.length;
    let gridClass = '';

    if (propertyCount === 0 && !fetchError) {
        // Handle case with no properties found (and no fetch error)
        return (
          <div className='find-your-space-container-main flex items-center justify-center margin-bottom' >
              <div className='find-your-space container'>
                  <SectionTitle
                      // title="Find Your Space"
                      title="Book now to Explore Life at Hubode"
                      subtext="Choose your space. Shape your plans. Hubode awaits."
                  />
                  <p style={{ textAlign: 'center', marginTop: '2rem' }}>No properties available at the moment.</p>
              </div>
          </div>
        );
    }
    if (fetchError) {
        // Handle fetch error state
          return (
          <div className='find-your-space-container-main flex items-center justify-center margin-bottom' >
              <div className='find-your-space container'>
                  <SectionTitle
                      // title="Find Your Space"
                      title="Book Now"
                      subtext="Pick your room. Pack your bags. Hubode is waiting."
                  />
                  <p style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{fetchError}</p>
              </div>
          </div>
        );
    }


    if (propertyCount === 1) {
      gridClass = 'count-1';
    } else if (propertyCount === 2) {
      gridClass = 'count-2';
    } else if (propertyCount === 3) {
      gridClass = 'count-3';
    } else { // 4 or more
      gridClass = 'count-4-plus';
    }

    return (
      <div className='find-your-space-container-main flex items-center justify-center margin-bottom' id='find-your-home'>
          <div className='find-your-space container'>
              <SectionTitle
                  // title="Find Your Space"
                  title="Book Now"
                  subtext="Pick your room. Pack your bags. Hubode is waiting."
              />

              {/* Use fetched properties */}
              <div className={`properties-container ${gridClass}`}>
                  {properties.map(property => {
                    const isComingSoon = Boolean(property.markAsComingSoon);
                    const bedSummary = [property.bedCount, property.bedPostText].filter(Boolean).join(' ').trim();
                    const lowestPrice = getLowestTierPrice(property);
                    const fallbackPrice = property.priceFrom || '';
                    const priceLabel = typeof lowestPrice === 'number' ? lowestPrice.toLocaleString('en-IN') : fallbackPrice;

                    const card = (
                      <div className="property-card">
                        <div className="card-image-container">
                          <img
                            src={urlFor(property.featuredImage)}
                            alt={property.featuredImage.alt || property.propertyName}
                          />
                        </div>
                        <div className="card-content">
                          <div className="location flex items-center">
                            <img src="/images/location-green.svg" alt="" />
                            <p>{property.locationName ?? 'Location TBD'}</p>
                          </div>
                          <h5>{property.propertyName}</h5>
                          {bedSummary && (
                            <div className="location bed-info-row flex items-center">
                              <img src="/images/bed-icon-green.svg" alt="" />
                              <p>{bedSummary}</p>
                            </div>
                          )}
                          <div className="room-types-container flex items-center justify-between">
                            {property.roomTypeNames && property.roomTypeNames.map((type) => {
                              const typeLabel = type === 'Duo' || type === 'Double' ? 'Twin' : type;
                              return (
                                <div className="type flex items-center" key={type}>
                                  {typeIconMap[type] && (
                                    <img
                                      src={typeIconMap[type]}
                                      alt={`${typeLabel} icon`}
                                      className={`type-icon ${generateTypeClassName(type)}`}
                                    />
                                  )}
                                  {typeLabel}
                                </div>
                              );
                            })}
                          </div>
                          <div className="early-access-pricing">
                            <p className="early-access-label">Early access pricing</p>
                            <h6 className="rent-amount">From <span>₹8,999/month</span></h6>
                            <p className="early-access-note">Unlocked via waitlist</p>
                          </div>
                        </div>
                      </div>
                    );

                    if (isComingSoon) {
                      return (
                        <div key={property._id} className="property-card-link coming-soon" aria-disabled="true">
                          <div className="property-card property-card--coming-soon">
                            <div className="card-image-container">
                              <img
                                src={urlFor(property.featuredImage)}
                                alt={property.featuredImage.alt || property.propertyName}
                              />
                              <div className="coming-soon-overlay">
                                <div className="coming-soon-meta">
                                  {/* <div className="coming-soon-location flex items-center">
                                    <img src="/images/location-green.svg" alt="" className="coming-soon-location__icon" />
                                    <p className="coming-soon-location__text">{property.locationName ?? 'Location TBD'}</p>
                                  </div> */}
                                  <p className="coming-soon-label">Stay tuned. Our next reveal lands here.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link href={`/properties/${property.slug}`} key={property._id} className="property-card-link">
                        {card}
                      </Link>
                    );
                  })}
              </div>
          </div>
      </div>
    );
  };

  export default FindYourSpace;

  //this is a comment
