// File: app/layout.tsx
"use client"; // REQUIRED for state, pathname, and sessionStorage access

import React, { useState, useEffect } from "react";
import { usePathname } from 'next/navigation'; // Import usePathname
import { Geist, Geist_Mono } from "next/font/google";
import "./(user)/globals.scss"; // Adjust path if globals.scss moved
import LoadingScreen from "./components/LoadingScreen/LoadingScreen"; // Import component
import WaitlistPopup from "./components/WaitlistPopup/WaitlistPopup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Key for session storage
const SESSION_STORAGE_KEY = 'hasHomepageLoadedOnce';
const WAITLIST_SESSION_KEY = 'hasDismissedWaitlistPopup';

/* Metadata export removed as it's 'use client' */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // State to track if the *specific loading sequence* we trigger is finished
  const [isLoadSequenceFinished, setIsLoadSequenceFinished] = useState(false);
  // State to determine if we SHOULD show the loader based on initial conditions
  const [shouldShowLoader, setShouldShowLoader] = useState(false);
  // Track if the initial check has been performed client-side
  const [isClientCheckDone, setIsClientCheckDone] = useState(false);
  const [showWaitlistPopup, setShowWaitlistPopup] = useState(false);

  const pathname = usePathname(); // Get the current path

  useEffect(() => {
    // This effect runs only once on the client after hydration
    try {
      const hasLoadedBefore = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
      const isOnHomepage = pathname === '/';

      // Determine if the loader should run based on conditions
      const show = isOnHomepage && !hasLoadedBefore;
      setShouldShowLoader(show);

      // If the loader is NOT supposed to show, mark the sequence as "finished" immediately
      if (!show) {
        setIsLoadSequenceFinished(true);
      }
      console.log(`Initial Load Check: Path='${pathname}', HasLoadedBefore=${hasLoadedBefore}, ShouldShowLoader=${show}`);

    } catch (e) {
      // Fallback if sessionStorage is unavailable or fails
      console.error("Session storage check failed:", e);
      setShouldShowLoader(false); // Don't show loader if storage fails
      setIsLoadSequenceFinished(true);
    } finally {
        setIsClientCheckDone(true); // Mark that the client-side check has run
    }

  }, [pathname]); // Depend on pathname to re-evaluate if needed? Usually just needs initial path. Let's stick to initial check.

    // Re-adjust useEffect to run only once on initial mount
    useEffect(() => {
        try {
            const hasLoadedBefore = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
            // Use window.location.pathname inside useEffect for reliable client-side path on mount
            const currentPath = window.location.pathname;
            const isOnHomepage = currentPath === '/';

            const show = isOnHomepage && !hasLoadedBefore;
            setShouldShowLoader(show);

            if (!show) {
                setIsLoadSequenceFinished(true);
            }
             console.log(`Initial Load Check (Mount): Path='${currentPath}', HasLoadedBefore=${hasLoadedBefore}, ShouldShowLoader=${show}`);

        } catch (e) {
            console.error("Session storage check failed on mount:", e);
            setShouldShowLoader(false);
            setIsLoadSequenceFinished(true);
        } finally {
             setIsClientCheckDone(true);
        }

    }, []); // Empty dependency array: Run ONLY once on mount

  useEffect(() => {
    if (!isClientCheckDone) return;
    try {
      // Disable auto-opening the initial waitlist popup on page load.
      setShowWaitlistPopup(false);
    } catch (error) {
      console.error("Waitlist popup session storage check failed:", error);
      setShowWaitlistPopup(false);
    }
  }, [pathname, isClientCheckDone]);

  useEffect(() => {
    const handleExternalOpen = () => {
      try {
        sessionStorage.setItem(WAITLIST_SESSION_KEY, 'false');
      } catch (error) {
        console.error('Unable to reset waitlist dismissal flag:', error);
      }
      setShowWaitlistPopup(true);
    };

    window.addEventListener('open-waitlist-popup', handleExternalOpen);
    return () => window.removeEventListener('open-waitlist-popup', handleExternalOpen);
  }, []);

  // Callback for LoadingScreen: Set session storage AND update state
  const handleLoadingComplete = () => {
    console.log("RootLayout notified: Loading sequence finished. Setting session flag.");
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'true'); // Set flag ONLY when loader completes
    } catch (e) {
        console.error("Failed to set session storage:", e);
    }
    setIsLoadSequenceFinished(true);
  };

  // Apply font variables
  const bodyClassName = `${geistSans.variable} ${geistMono.variable}`.trim();
  const isLoaderActive = shouldShowLoader && !isLoadSequenceFinished;

  // Avoid rendering children before the client-side check is done
  // to prevent potential layout shifts or incorrect initial state rendering
  if (!isClientCheckDone) {
      // Render minimal structure or nothing until check is done
      return (
          <html lang="en">
              <body className={bodyClassName}>
                  {/* Optionally, a very basic placeholder can go here */}
              </body>
          </html>
      );
  }

  const handleWaitlistDismiss = () => {
    try {
      sessionStorage.setItem(WAITLIST_SESSION_KEY, 'true');
    } catch (error) {
      console.error("Unable to persist waitlist dismissal:", error);
    }
    setShowWaitlistPopup(false);
  };

  const shouldRenderWaitlist = showWaitlistPopup && !isLoaderActive;

  return (
    <html lang="en">
      <body className={bodyClassName}>
        {/* Render the main site children (content) ALWAYS */}
        {children}

        {/* Conditionally render the LoadingScreen overlay */}
        {/* Show only if conditions were met AND sequence isn't finished */}
        {shouldShowLoader && !isLoadSequenceFinished && (
          <LoadingScreen onLoadingComplete={handleLoadingComplete} />
        )}

        {shouldRenderWaitlist && (
          <WaitlistPopup isVisible={shouldRenderWaitlist} onClose={handleWaitlistDismiss} />
        )}
      </body>
    </html>
  );
}
