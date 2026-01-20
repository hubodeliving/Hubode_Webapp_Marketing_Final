// File: app/components/LoadingScreen/LoadingScreen.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import './loadingScreen.scss'; // Using standard SCSS

interface LoadingScreenProps {
  onLoadingComplete: () => void; // Function to call when fade-out finishes
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container

  const handleVideoEnd = () => {
    console.log("Video ended, starting fade out.");
    setIsFadingOut(true);
  };

  useEffect(() => {
    const container = containerRef.current;

    const handleTransitionEnd = (event: TransitionEvent) => {
        // Ensure the transitionEnd event is for the opacity property on the container
        if (container && event.target === container && event.propertyName === 'opacity') {
            console.log("Fade out transition finished.");
            onLoadingComplete(); // Signal that loading is truly complete
        }
    };

    if (isFadingOut && container) {
      // Listen for the end of the CSS transition
      container.addEventListener('transitionend', handleTransitionEnd);
    }

    // Cleanup function to remove the event listener
    return () => {
      if (container) {
        container.removeEventListener('transitionend', handleTransitionEnd);
      }
    };
  }, [isFadingOut, onLoadingComplete]); // Depend on fade state and the callback

  // Construct the className string conditionally
  const containerClassName = `loading-screen-container ${isFadingOut ? 'fade-out' : ''}`;

  return (
    // Use plain string class names for standard SCSS
    <div ref={containerRef} className={containerClassName}>
      <video
        ref={videoRef}
        className="loading-screen-video" // Plain class name
        src="/videos/loading-video.mp4" // Path relative to public folder
        autoPlay
        muted    // REQUIRED for reliable autoplay
        playsInline // Important for mobile
        onEnded={handleVideoEnd}
        preload="auto" // Good practice
        // Optional: Add an error handler
        onError={(e) => {
            console.error("Video loading error:", e);
            // If video fails, immediately trigger loading complete
            setIsFadingOut(true); // Start fade even if video fails
        }}
      />
      {/* Optional: Fallback content ONLY if video fails, might need state */}
      {/* <div className="fallback-content">Loading Site...</div>*/}
    </div>
  );
};

export default LoadingScreen;
