// File: app/(main)/layout.tsx
"use client"; // Required because we use the usePathname hook

import React from "react";
import { usePathname } from 'next/navigation'; // Hook to get the current URL path

// Adjust import paths if components are located differently relative to app/(main)/
import Header from "@/app/(user)/components/Header/Header";
import Footer from "@/app/(user)/components/Footer/Footer";
import HomieButton from "@/app/(user)/components/HomieButton/page";
import { AuthProvider } from '@/context/AuthContext';

// Font variables and global styles are applied by the root layout (app/layout.tsx)

export default function MainLayout({
  children,
}: { // Use standard ReactNode type here, Readonly<> is often for root props
  children: React.ReactNode;
}) {
  // Get the current path to determine header theme
  const pathname = usePathname();

  // Calculate theme condition based on the current path
  // Ensure these paths match your actual routes
  const isAltThemePage =
    (pathname.startsWith('/career/') && pathname.length > '/career/'.length) || // Check for specific career page
    (pathname.startsWith('/blog/') && pathname.length > '/blog/'.length);      // Check for specific blog post page

  // This component renders the common UI around the specific page content
  return (
    <> {/* Use a React Fragment to avoid adding an extra unnecessary div to the DOM */}
      {/* Pass the calculated theme boolean as a prop to the Header */}
      <AuthProvider>
      <Header isAltTheme={isAltThemePage} />

{/* Render the actual page component passed as children */}
<main>{children}</main>

{/* Render other common UI elements */}
<HomieButton />
<Footer />
      </AuthProvider>
    </>
  );
}