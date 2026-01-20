import type { Image as SanityImage } from 'sanity';

export interface Post {
  _id: string;
  title?: string;
  slug?: {
    current: string;
  };
  mainImage?: SanityImage & {
    alt?: string;
  };
  publishedAt?: string;
  body?: any; // Portable Text content
}

export interface ImageWithAlt extends SanityImage {
  alt?: string;
} 