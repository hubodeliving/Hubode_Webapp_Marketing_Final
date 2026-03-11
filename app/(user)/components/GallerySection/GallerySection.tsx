import React from 'react';
import './gs.scss';
import SectionTitle from '../SectionTitle/SectionTitle';

export const revalidate = 900; // Revalidate every 15 minutes

const INSTAGRAM_USERNAME = 'hubodeliving';
const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const INSTAGRAM_GRAPH_API_URL = 'https://graph.instagram.com/me/media';

type InstagramPost = {
  id: string;
  imageUrl: string;
  caption: string;
  permalink: string;
};

// High-quality fallback images from public/images — shown when Instagram token is not configured
const FALLBACK_POSTS: InstagramPost[] = [
  { id: 'fallback-1', imageUrl: '/images/gallery-1.png', caption: 'Hubode Living spaces', permalink: INSTAGRAM_PROFILE_URL },
  { id: 'fallback-2', imageUrl: '/images/gallery-2.png', caption: 'Community at Hubode', permalink: INSTAGRAM_PROFILE_URL },
  { id: 'fallback-3', imageUrl: '/images/gallery-3.png', caption: 'Your home at Hubode', permalink: INSTAGRAM_PROFILE_URL },
  { id: 'fallback-4', imageUrl: '/images/gallery-4.png', caption: 'Life at Hubode', permalink: INSTAGRAM_PROFILE_URL },
];

async function fetchInstagramPosts(): Promise<InstagramPost[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('[GallerySection] INSTAGRAM_ACCESS_TOKEN is not set. Showing fallback images.');
    return [];
  }

  try {
    const graphUrl = `${INSTAGRAM_GRAPH_API_URL}?fields=id,caption,media_url,thumbnail_url,media_type,permalink&access_token=${accessToken}&limit=4`;
    const response = await fetch(graphUrl, { next: { revalidate } });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[GallerySection] Instagram Graph API error ${response.status}:`, errorBody);
      return [];
    }

    const payload = await response.json();
    const posts: InstagramPost[] = (payload?.data ?? [])
      .slice(0, 4)
      .map((item: any, index: number) => {
        // Use thumbnail for VIDEO posts, media_url for images/albums
        const imageUrl =
          item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url;
        if (!imageUrl) return null;

        return {
          id: item.id ?? `ig-post-${index}`,
          imageUrl,
          caption: item.caption ?? 'Hubode Living on Instagram',
          permalink: item.permalink ?? INSTAGRAM_PROFILE_URL,
        } as InstagramPost;
      })
      .filter(Boolean) as InstagramPost[];

    return posts;
  } catch (error) {
    console.error('[GallerySection] Failed to fetch Instagram posts:', error);
    return [];
  }
}

const GallerySection = async () => {
  const instagramPosts = await fetchInstagramPosts();
  // If API returned posts, use them; otherwise show the gallery fallbacks
  const galleryItems = instagramPosts.length > 0 ? instagramPosts : FALLBACK_POSTS;

  return (
    <div className="gallery-section-container-main flex items-center justify-center margin-bottom">
      <div className="gallery-section container">
        <SectionTitle
          title="Stay Connected With Hubode"
          subtext="Join our socials to see what's new at Hubode, discover fresh stories, and catch behind-the-scenes moments."
        />

        <div className="images-container">
          {galleryItems.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="img-item instagram-post"
            >
              <img src={post.imageUrl} alt={post.caption} loading="lazy" />
            </a>
          ))}

          {/* Instagram follow CTA tile */}
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="img-item instagram-item"
          >
            <img src="/images/insta-icon-gallery.svg" alt="Instagram Icon" className="insta-icon" />
            <p>Follow @{INSTAGRAM_USERNAME}</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default GallerySection;
