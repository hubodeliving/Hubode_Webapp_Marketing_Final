// File: lib/sanity.client.server.ts
import { createClient, type SanityClient } from 'next-sanity';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION!;
const token = process.env.SANITY_API_WRITE_TOKEN!; // Server-side only

if (!projectId || !dataset || !apiVersion || !token) {
  throw new Error("Sanity server configuration is missing required environment variables.");
}

export const client: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token, // Use the write token
  useCdn: false, // Typically false for write operations
});