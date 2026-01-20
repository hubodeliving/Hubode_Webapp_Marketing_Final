// File: app/(main)/loading.tsx
// This file provides the loading UI for transitions between pages within the (main) layout.

import React from 'react';
// Import the specific SCSS file for this transition loading component
import './transition-loading.scss';

export default function TransitionLoading() {
  // This component renders the UI that shows during page transitions
  return (
    // Container with green background, centered using flexbox, covers full screen
    // Use the class names defined in transition-loading.scss
    <div className="transition-loading-container"> {/* Class name matches SCSS */}
      {/* Inner container might not be strictly needed for centering with flex */}
      <div className="transition-loading-gif-container"> {/* Class name matches SCSS */}
        <img
          src="/images/buffering-icon.gif" // Path to your GIF in the public folder
          alt="Loading..." // Descriptive alt text
          className="transition-loading-gif" // Class name matches SCSS
        />
      </div>
    </div>
  );
}