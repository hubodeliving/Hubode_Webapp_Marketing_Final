// File: app/(admin)/layout.tsx
import React from 'react';
import AdminClientLayoutInternal from './AdminClientLayoutInternal'; // Renamed for clarity

export const metadata = {
  title: {
    default: 'Hubode Admin',
    template: '%s | Hubode Admin',
  },
  description: 'Hubode Property Management Admin Portal.',
  // robots: { index: false, follow: false }
};

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Head is automatically populated by Next.js based on metadata and children */}
      <body>
        <AdminClientLayoutInternal>{children}</AdminClientLayoutInternal>
      </body>
    </html>
  );
}