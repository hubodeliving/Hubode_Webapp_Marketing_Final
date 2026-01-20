"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createClient, groq } from 'next-sanity'; // Assuming next-sanity
import './style.scss';

// --- Sanity Client Configuration (Example - adjust to your project) ---
// You might have this in a separate file like 'lib/sanity.client.ts'
// and import 'client' from there.
const sanityClientConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-08-01', // Use a recent API version
  useCdn: process.env.NODE_ENV === 'production', // `false` if you want to ensure fresh data
};
const client = createClient(sanityClientConfig);
// --- End Sanity Client Configuration ---


// Static data for the popup content (keep as is)
const stepsData = [
    { icon: "/images/map-green.svg", text: "Book your place" },
    { icon: "/images/move-in-green.svg", text: "Walk in & Feel at Home" },
    { icon: "/images/connect-green.svg", text: "Live and Thrive" },
];

const faqPreviewData = [
    { question: "What is Hubode?", link: "/faq#what-is-hubode" },
    { question: "How does the booking process work?", link: "/faq#booking-process" },
    { question: "What amenities are included?", link: "/faq#amenities" },
];

// Interface for the fetched idle message data
interface IdleMessage {
  _id: string;
  message: string;
  order?: number; // Optional if you don't always sort by it client-side but rely on GROQ
}

const FADE_ANIMATION_DURATION = 300; // Milliseconds, ensure this matches SCSS transition duration

const FaqFab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const shouldHide = pathname.startsWith('/propertydetail');

  // State for idle messages fetched from Sanity
  const [dynamicIdleMessages, setDynamicIdleMessages] = useState<IdleMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true); // Optional: for loading state

  // State for idle message bubble
  const [currentMessageText, setCurrentMessageText] = useState<string | null>(null);
  const [isBubbleActive, setIsBubbleActive] = useState(false);
  const currentMessageIndexRef = useRef(0);
  const messageCycleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const closePopup = () => {
    setIsOpen(false);
  };

  // Effect to fetch idle messages from Sanity on component mount
  useEffect(() => {
    const fetchIdleMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const query = groq`*[_type == "idleMessage"] | order(order asc, _createdAt asc) {
          _id,
          message,
          order
        }`;
        const messages = await client.fetch<IdleMessage[]>(query);
        setDynamicIdleMessages(messages);
      } catch (error) {
        console.error("Failed to fetch idle messages from Sanity:", error);
        setDynamicIdleMessages([]); // Set to empty or handle error appropriately
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchIdleMessages();
  }, []); // Empty dependency array: fetch only once on mount

  // Effect to manage the message display cycle
  useEffect(() => {
    const clearMessageCycleTimer = () => {
      if (messageCycleTimerRef.current) {
        clearTimeout(messageCycleTimerRef.current);
        messageCycleTimerRef.current = null;
      }
    };

    // If messages are loading, or there are no messages, or component shouldn't run cycle
    if (isLoadingMessages || dynamicIdleMessages.length === 0) {
      clearMessageCycleTimer();
      setIsBubbleActive(false);
      setTimeout(() => setCurrentMessageText(null), FADE_ANIMATION_DURATION);
      currentMessageIndexRef.current = 0; // Reset index
      return;
    }

    const runMessageCycle = () => {
      clearMessageCycleTimer();

      messageCycleTimerRef.current = setTimeout(() => {
        // Ensure current index is valid (can happen if messages array changes)
        if (currentMessageIndexRef.current >= dynamicIdleMessages.length) {
            currentMessageIndexRef.current = 0;
        }
        // Ensure we still have messages after potential array change
        if (dynamicIdleMessages.length === 0) return;

        setCurrentMessageText(dynamicIdleMessages[currentMessageIndexRef.current].message);
        setIsBubbleActive(true);

        messageCycleTimerRef.current = setTimeout(() => {
          setIsBubbleActive(false);

          messageCycleTimerRef.current = setTimeout(() => {
            setCurrentMessageText(null);
            currentMessageIndexRef.current = (currentMessageIndexRef.current + 1) % dynamicIdleMessages.length;
            if (!isOpen && !shouldHide) { // Only continue cycle if FAB is still idle
                runMessageCycle();
            }
          }, FADE_ANIMATION_DURATION);
        }, 4000); // Message visible duration (4 seconds)
      }, 30000); // Idle duration (30 seconds)
    };

    if (isOpen || shouldHide) {
      clearMessageCycleTimer();
      setIsBubbleActive(false);
      setTimeout(() => setCurrentMessageText(null), FADE_ANIMATION_DURATION);
      currentMessageIndexRef.current = 0; // Reset message index
      return;
    }

    // Start the cycle if conditions are met
    runMessageCycle();

    return () => {
      clearMessageCycleTimer();
    };
  }, [isOpen, shouldHide, dynamicIdleMessages, isLoadingMessages]); // Dependencies

  if (shouldHide) {
    return null;
  }

  return (
    <div className={`faq-fab-container ${isOpen ? 'popup-open' : ''}`}>

      {/* --- Idle Message Bubble --- */}
      {/* Only render the bubble structure if there's text to show or it's animating out */}
      {(currentMessageText || isBubbleActive) && dynamicIdleMessages.length > 0 && (
        <div className={`idle-message-bubble ${isBubbleActive ? 'visible' : ''}`}>
          {currentMessageText && (
            <span key={currentMessageText} className="idle-message-text">
              {currentMessageText}
            </span>
          )}
        </div>
      )}


      {/* --- Popup Window (existing code) --- */}
      <div key={isOpen ? 'open' : 'closed'} className={`faq-popup ${isOpen ? 'open' : ''}`}>
        <h5>Hi its Homey Here</h5>
        <p className="subtitle">The booking process in 3 simple steps</p>
        <div className="steps-row">
          {stepsData.map((step, index) => (
            <div className="step" key={index}>
              <img src={step.icon} alt="" className="step-icon"/>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
        <div className="faq-list">
          {faqPreviewData.map((faq, index) => (
            <Link href={faq.link} key={index} className="faq-item" onClick={closePopup}>
              {faq.question}
            </Link>
          ))}
        </div>
        <Link href="/faq" className="view-all-btn" onClick={closePopup}>
          View All Questions
        </Link>
      </div>

      {/* --- Floating Action Button (existing code) --- */}
      <button className="faq-fab-button" onClick={togglePopup} aria-expanded={isOpen} aria-label="Toggle FAQ Chat">
        <img src="/images/mascot-for-btn.gif" alt="FAQ Mascot" />
      </button>

    </div>
  );
};

export default FaqFab;