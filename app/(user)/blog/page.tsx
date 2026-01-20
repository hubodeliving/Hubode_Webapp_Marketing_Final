// FILE: app/(user)/blog/page.tsx

import React from 'react';
import Link from 'next/link'; // Import Link for navigation
import TopSection from '../components/TopSection/TopSection'; // Adjust path
import './style.scss'; // Styles for this page (needs blog item styles)
import Pagination from '../components/Pagination/Pagination'; // Import Pagination component
// Sanity Imports - Adjust paths
import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';
import { groq } from 'next-sanity';

// --- Define the BlogPost interface matching your schema ---
interface BlogPost {
  _id: string;
  title?: string;
  slug?: { current?: string }; // Slug is an object with 'current' property
  publishedAt?: string; // Date string (e.g., "YYYY-MM-DD")
  mainImage?: {
    asset?: { _ref: string; _type: 'reference'; };
    alt?: string;
  };
  excerpt?: string; // Use the excerpt field
}
// --- End of interface definition ---

// Helper function to format the date
const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Date not set';
    try {
      const [year, month, day] = dateString.split('-');
      const shortYear = year.slice(-2);
      return `${day}-${parseInt(month, 10)}-${shortYear}`;
    } catch (e) { console.error("Error formatting date:", e); return dateString; }
};

const POSTS_PER_PAGE = 12;

// Define the GROQ query to fetch a specific page of posts
// And another query to get the total count
const blogPostsQuery = groq`*[_type == "blogPost"] | order(publishedAt desc) [$startIndex...$endIndex] {
  _id,
  title,
  slug,
  publishedAt,
  mainImage { asset, alt },
  excerpt
}`;

const totalPostsQuery = groq`count(*[_type == "blogPost"])`;


// --- Page Component - Receives searchParams for pagination ---
interface BlogPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

const BlogPage = async ({ searchParams }: BlogPageProps) => {

  // --- Pagination Logic ---
  const page = searchParams?.['page'] ?? '1'; // Default to page 1 if param is missing
  const currentPage = Math.max(1, parseInt(Array.isArray(page) ? page[0] : page, 10) || 1); // Ensure valid number >= 1
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE; // Sanity slice is exclusive of endIndex

  // --- Fetch Data ---
  let posts: BlogPost[] = [];
  let totalPosts: number = 0;
  let fetchError: string | null = null;

  try {
    // Fetch total count and posts for the current page in parallel
    const [fetchedPosts, fetchedTotal] = await Promise.all([
        client.fetch<BlogPost[]>(blogPostsQuery, { startIndex, endIndex }),
        client.fetch<number>(totalPostsQuery)
    ]);
    posts = fetchedPosts ?? [];
    totalPosts = fetchedTotal ?? 0;

  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    fetchError = "Could not load blog posts. Please try again later.";
    posts = [];
    totalPosts = 0;
  }

  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  const hasPosts = posts && posts.length > 0;

  // --- Render ---
  return (
    <div>
      <TopSection
        title="Our Diary Pages"
        subtext="Tips. Stories. Big ideas from small rooms. Whether you're finding your feet or finding your crew, this is where the journey lives."
        backgroundImageUrl='/images/blog-cover.png'
      />

      <div className="blog-items-section-container flex items-center justify-center margin-bottom">
          <div className="blog-items-section container">

              {/* Handle Fetch Error State */}
              {fetchError && (
                  <div className="error-message-container" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2em', color: 'red' }}>
                      <p>{fetchError}</p>
                  </div>
              )}

              {/* Handle No Posts State */}
              {!fetchError && !hasPosts && (
                  // Use the same styled container as community page
                  <div className="no-events-message-container" /* Style via SCSS */ >
                      <p>No blog posts found yet. Check back soon!</p>
                  </div>
              )}

              {/* Render Blog Posts if available */}
              {!fetchError && hasPosts && (
                  posts.map((item) => (
                    // Wrap the entire item in a Link component
                    <Link href={`/blog/${item.slug?.current ?? '#'}`} key={item._id} className="blog-item-link">
                        <div className="blog-item">
                            {item.mainImage?.asset ? (
                                <div className="image-section" style={{ backgroundImage: `url(${urlFor(item.mainImage).width(600).auto('format').url()})` }}>
                                    {/* Arrow is just visual within the link now */}
                                    <span className="arrow-icon">
                                        <img src="/images/arrow-blog.svg" alt="" /> {/* Alt text empty as icon is decorative within link */}
                                    </span>
                                </div>
                            ) : (
                                <div className="image-section placeholder-bg"> {/* Add a placeholder style */}
                                     <span className="arrow-icon">
                                        <img src="/images/arrow-blog.svg" alt="" />
                                    </span>
                                </div>
                            )}

                            <div className="content-section">
                                <h5 className="blog-title">
                                    {item.title || 'Untitled Post'}
                                </h5>

                                <div className="date-container">
                                    <img src="/images/calendar-blog.svg" alt="Calendar icon" />
                                    <p className="date">{formatDate(item.publishedAt)}</p>
                                </div>

                                {/* Use the excerpt field */}
                                <p className="subtext">
                                    {item.excerpt || 'No summary available.'}
                                </p>
                            </div>
                        </div>
                    </Link> // End Link wrapper
                  ))
              )}
          </div> {/* End .blog-items-section.container */}
      </div> {/* End .blog-items-section-container */}

      {/* Render Pagination if needed */}
      {!fetchError && totalPages > 1 && (
          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl="/blog" // Base path for blog links
          />
      )}

    </div> // End main wrapper div
  );
}

export default BlogPage;