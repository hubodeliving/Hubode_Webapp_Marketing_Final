import React from 'react';
import { Buffer } from 'buffer';
import './gs.scss';
import SectionTitle from '../SectionTitle/SectionTitle';

export const revalidate = 900; // refresh Instagram data every 15 minutes

const INSTAGRAM_USERNAME = 'hubodeliving';
const INSTAGRAM_PROFILE_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
const INSTAGRAM_API_URL = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${INSTAGRAM_USERNAME}`;
const INSTAGRAM_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'x-ig-app-id': '936619743392459',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  Referer: 'https://www.instagram.com/',
};
const INSTAGRAM_IMAGE_HEADERS = {
  'User-Agent': INSTAGRAM_HEADERS['User-Agent'],
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': INSTAGRAM_HEADERS['Accept-Language'],
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Dest': 'image',
  Referer: INSTAGRAM_HEADERS.Referer,
};

type InstagramPost = {
  id: string;
  imageUrl: string;
  caption: string;
  permalink: string;
};

const FALLBACK_POSTS: InstagramPost[] = [
  { id: 'fallback-1', imageUrl: '/images/hero-img.png', caption: 'Hubode Living preview', permalink: INSTAGRAM_PROFILE_URL },
  { id: 'fallback-2', imageUrl: '/images/hero-img.png', caption: 'Hubode Living preview', permalink: INSTAGRAM_PROFILE_URL },
  { id: 'fallback-3', imageUrl: '/images/hero-img.png', caption: 'Hubode Living preview', permalink: INSTAGRAM_PROFILE_URL },
  { id: 'fallback-4', imageUrl: '/images/hero-img.png', caption: 'Hubode Living preview', permalink: INSTAGRAM_PROFILE_URL },
];

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { headers: INSTAGRAM_IMAGE_HEADERS, cache: 'no-store' });
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Failed to proxy Instagram image:', error);
    return null;
  }
}

async function fetchInstagramPosts(): Promise<InstagramPost[]> {
  try {
    const response = await fetch(INSTAGRAM_API_URL, {
      headers: INSTAGRAM_HEADERS,
      next: { revalidate },
    });

    if (!response.ok) {
      throw new Error(`Instagram request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges ?? [];

    const rawPosts = edges
      .slice(0, 4)
      .map((edge: any, index: number) => {
        const node = edge?.node;
        if (!node) return null;

        const thumbnail: string | undefined =
          node.thumbnail_src ||
          node.display_url ||
          node.thumbnail_resources?.[node.thumbnail_resources.length - 1]?.src;

        if (!thumbnail) return null;

        return {
          id: node.id || node.shortcode || `ig-post-${index}`,
          imageUrl: thumbnail,
          caption: node.accessibility_caption || 'Hubode Living on Instagram',
          permalink: node.shortcode ? `https://www.instagram.com/p/${node.shortcode}/` : INSTAGRAM_PROFILE_URL,
        } as InstagramPost;
      })
      .filter(Boolean) as InstagramPost[];

    const hydratedPosts = await Promise.all(
      rawPosts.map(async (post) => {
        const proxiedImage = await fetchImageAsDataUrl(post.imageUrl);
        if (!proxiedImage) return null;
        return { ...post, imageUrl: proxiedImage } as InstagramPost;
      })
    );

    return hydratedPosts.filter(Boolean) as InstagramPost[];
  } catch (error) {
    console.error('Failed to fetch Instagram posts:', error);
    return [];
  }
}

const GallerySection = async () => {
  const instagramPosts = await fetchInstagramPosts();
  const galleryItems = instagramPosts.length
    ? [...instagramPosts, ...FALLBACK_POSTS].slice(0, 4)
    : FALLBACK_POSTS;

  return (
    <div className='gallery-section-container-main flex items-center justify-center margin-bottom'> {/* Added -main suffix */}
        <div className="gallery-section container">

            <SectionTitle
              title="Stay Connected With Hubode"
              subtext="Join our socials to see what’s new at Hubode, discover fresh stories, and catch behind the scenes."
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

                {/* Instagram Link Item */}
                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank" // Open in new tab
                  rel="noopener noreferrer" // Security best practice
                  className="img-item instagram-item" // Combined classes
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
