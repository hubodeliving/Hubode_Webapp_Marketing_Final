"use client"
import React, { useState, useRef, useEffect } from 'react';
import './tst.scss'; // Styles for this component

// Placeholder SVG icons (replace with actual SVGs or an icon library)
const MutedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
);
const UnmutedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
);


const TestimonialsSection = () => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Sync video muted state with component state
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div className='testimonials-section-container-main flex items-center justify-center margin-bottom'> {/* Added -main suffix & margin */}
        <div className="testimonials-section-container container"> {/* Use the inner container class */}
            <div className="left-section-container">
                <h3>Hear It From Our Neighbors</h3>
                <p>Hubode made finding a home stress-free. The space is great and the people are even better!
                Finally, a place where you can chill, work, and make friends all under one roof.</p>
            </div>

            <div className="right-section-container">
                <video
                  ref={videoRef}
                  src="/videos/testimonials.mp4" // Replace with your video path
                  muted // Start muted
                  autoPlay
                  loop
                  playsInline // Important for iOS
                  poster="/images/testimonial-poster.png" // Optional poster image
                ></video>
                <button
                  className="mute-toggle-button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute video" : "Mute video"}
                >
                  {isMuted ? <MutedIcon /> : <UnmutedIcon />}
                </button>
            </div>
        </div>
    </div>
  );
};

export default TestimonialsSection;