import FindYourSpace from "./components/FindYourSpace/FindYourSpace";
import Hero from "./components/Hero/Hero";
import KeyFtSection from "./components/KeyFtSection/KeyFtSection";
import TypeOfUnits from "./components/TypeOfUnits/TypeOfUnits";
import HubodeOfferings from "./components/HubodeOfferings/HubodeOfferings";
import CommunitySection from "./components/CommunitySection/CommunitySection";
import TestimonialsSection from "./components/TestimonialsSection/TestimonialsSection";
import HubodeSteps from "./components/HubodeSteps/HubodeSteps";
import FaqSection from "./components/FaqSection/FaqSection";
import GallerySection from "./components/GallerySection/GallerySection";
import ScrollToHash from "./components/ScrollToHash/ScrollToHash";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hubode Living | Community-First Co-Living Spaces",
  description:
    "Hubode is a community-first co-living brand for in-betweeners - makers, thinkers, interns, creatives - offering thoughtfully designed shared living and spaces built for belonging.",
};

export const dynamic = 'force-dynamic'; // Force dynamic rendering
export const revalidate = 60; // Still use ISR to revalidate every 60 seconds

export default function Home() {
  return (
    <div>
        <ScrollToHash />
        <Hero/>
        <KeyFtSection/>
        <FindYourSpace/>
        <TypeOfUnits/>
        <HubodeOfferings/>
        {/* <CommunitySection/> */}
        {/* <TestimonialsSection/> */}
        <HubodeSteps/>
        <FaqSection/>
        <GallerySection/>
        
    </div>
  );
}
