// sanity/lib/client.ts

import { createClient, type SanityClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { apiVersion, dataset, projectId } from '../env' // Assuming env.ts reads NEXT_PUBLIC_* vars

// --- Public Client (for client-side reads) ---
// Reads NEXT_PUBLIC_* variables from env.ts or process.env directly
export const client: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production', // Use CDN for public reads in production
})

// --- Write Client (for server-side mutations) ---
// Reads the secure token directly from process.env on the server
const writeToken = process.env.SANITY_API_WRITE_TOKEN;

if (!writeToken && process.env.NODE_ENV !== 'development') {
    // Log an error in production if the write token is missing
    // In development, it might be okay if only reads are happening
    console.error('CRITICAL: Missing SANITY_API_WRITE_TOKEN environment variable for mutations.');
}

export const writeClient: SanityClient = createClient({
    projectId,
    dataset,
    apiVersion,
    token: writeToken, // Use the secure server-side token
    useCdn: false, // ALWAYS set useCdn to false for authenticated requests/mutations
    ignoreBrowserTokenWarning: true, // Suppress warning as this client *should* only be used server-side
});


// --- Image URL Builder Setup (using the public client is fine) ---
const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource | undefined | null) {
  if (!source?.asset) {
    return undefined;
  }
  return builder.image(source);
}