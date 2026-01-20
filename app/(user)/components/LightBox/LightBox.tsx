"use client"; // Needed for hooks
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import './lightbox.scss'; // Styles for this component

// Define the props interface
interface LightboxProps {
  images: { src: string; alt: string }[];
  startIndex: number;
  onClose: () => void;
}

// --- SVG Icons --- (Defined outside component for clarity)
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const PrevIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const NextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);
// --- End SVG Icons ---


const Lightbox: React.FC<LightboxProps> = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isClosing, setIsClosing] = useState(false);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  }, [images.length]);

  const handleClose = useCallback(() => {
      setIsClosing(true);
      const timer = setTimeout(() => {
          onClose();
      }, 300);
      return () => clearTimeout(timer);
  }, [onClose]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleClose, goToPrevious, goToNext]);


  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={`lightbox-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        {/* Image Container - This will now have the fixed size */}
        <div className="lightbox-image-container">
          <img
            key={images[currentIndex].src}
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            className="lightbox-image"
           />
        </div>

        {/* Controls */}
        <button className="lightbox-btn close-btn" onClick={handleClose} aria-label="Close gallery">
          <CloseIcon />
        </button>

        {images.length > 1 && (
          <>
            <button className="lightbox-btn nav-btn prev" onClick={goToPrevious} aria-label="Previous image">
              <PrevIcon />
            </button>
            <button className="lightbox-btn nav-btn next" onClick={goToNext} aria-label="Next image">
              <NextIcon />
            </button>
            <div className="lightbox-counter">{currentIndex + 1} / {images.length}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Lightbox;