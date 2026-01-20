"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import './hero.scss';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
    }
  }, []);

  const handleToggleAudio = useCallback(() => {
    if (!videoRef.current) return;

    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    if (!nextMuted) {
      videoRef.current.volume = 1;
    }
    setIsMuted(nextMuted);
  }, [isMuted]);

  return (
    <div className='hero-container-main relative flex items-center justify-center'>
        <video
            className="hero-background-video"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            preload="auto"
            poster="/images/hero-img.png"
            ref={videoRef}
        >
            <source src="/videos/hubode-hero-video.webm" type="video/webm" />
            <source src="/videos/hubode-hero-video.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-container container relative z-10 flex items-center justify-start">
            <div className="content-container flex flex-col">
                <h1><span>Co</span>mplete <span>Living</span></h1>
                <p className='subtext'>
                Discover a home built for collaboration, meaningful connections, and the quiet confidence of growth.
                </p>
                <div className="search-bar">

                </div>
            </div>
        </div>
        <button
            type="button"
            className="hero-audio-toggle"
            onClick={handleToggleAudio}
            aria-pressed={!isMuted}
            aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
        >
            {isMuted ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 9v6h4l5 4V5l-5 4H4z" />
                    <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 9v6h4l5 4V5l-5 4H4z" />
                    <path d="M16 10a3 3 0 0 1 0 4" />
                    <path d="M18.5 8.5a6 6 0 0 1 0 7" />
                </svg>
            )}
        </button>
    </div>
  );
};

export default Hero;
