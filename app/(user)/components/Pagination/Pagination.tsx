// app/(user)/components/Pagination/Pagination.tsx
"use client"; // This component uses URL interaction

import React from 'react';
import Link from 'next/link';
import './Pagination.scss'; // We'll create this SCSS file

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // Base path for the links (e.g., "/blog")
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  baseUrl,
}) => {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  const pageNumbers = [];
  // Simple logic: show first, last, current, and nearby pages
  // You can implement more complex logic (e.g., ellipsis) if needed
  const maxPagesToShow = 5; // Max number of page links shown (excluding prev/next)
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  // Adjust startPage if endPage is at the limit
  if (endPage === totalPages) {
    startPage = Math.max(1, totalPages - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // Helper to create page link URLs
  const createPageUrl = (page: number) => {
    return `${baseUrl}?page=${page}`;
  };

  return (
    <nav className="pagination-container" aria-label="Blog post pagination">
      {/* Previous Button */}
      <Link
        href={createPageUrl(currentPage - 1)}
        className={`page-link prev ${currentPage === 1 ? 'disabled' : ''}`}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined} // Improve accessibility
      >
        ← Previous {/* Left arrow */}
      </Link>

      {/* Page Number Links */}
      {startPage > 1 && ( // Show first page and ellipsis if needed
        <>
          <Link href={createPageUrl(1)} className="page-link">1</Link>
          {startPage > 2 && <span className="ellipsis">...</span>}
        </>
      )}

      {pageNumbers.map((pageNumber) => (
        <Link
          key={pageNumber}
          href={createPageUrl(pageNumber)}
          className={`page-link ${pageNumber === currentPage ? 'active' : ''}`}
          aria-current={pageNumber === currentPage ? 'page' : undefined}
        >
          {pageNumber}
        </Link>
      ))}

      {endPage < totalPages && ( // Show last page and ellipsis if needed
        <>
         {endPage < totalPages -1 && <span className="ellipsis">...</span>}
          <Link href={createPageUrl(totalPages)} className="page-link">{totalPages}</Link>
        </>
      )}


      {/* Next Button */}
      <Link
        href={createPageUrl(currentPage + 1)}
        className={`page-link next ${currentPage === totalPages ? 'disabled' : ''}`}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
      >
        Next → {/* Right arrow */}
      </Link>
    </nav>
  );
};

export default Pagination;