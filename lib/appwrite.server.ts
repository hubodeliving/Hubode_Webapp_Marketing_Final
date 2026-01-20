// File: lib/appwrite.server.ts
/**
 * Use the Node‐only Appwrite SDK here so that
 * setEndpoint().setProject().setKey() can be chained.
 * Do NOT import this from client‐side/edge code.
 */

import { Client, Databases, ID, Query, AppwriteException } from 'node-appwrite';

// ───────────────
// 1. REQUIRED ENV VARS
// ───────────────
const APPWRITE_ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY    = process.env.APPWRITE_API_KEY;

if (!APPWRITE_ENDPOINT) {
  console.error('❌ CRITICAL: NEXT_PUBLIC_APPWRITE_ENDPOINT is not defined.');
  throw new Error('Appwrite Server Config Error: Missing NEXT_PUBLIC_APPWRITE_ENDPOINT.');
}
if (!APPWRITE_PROJECT_ID) {
  console.error('❌ CRITICAL: NEXT_PUBLIC_APPWRITE_PROJECT_ID is not defined.');
  throw new Error('Appwrite Server Config Error: Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID.');
}
if (!APPWRITE_API_KEY) {
  console.error('❌ CRITICAL: APPWRITE_API_KEY is not defined.');
  throw new Error('Appwrite Server Config Error: Missing APPWRITE_API_KEY.');
}

console.log('[Appwrite Server Client] ✔ Endpoint:', APPWRITE_ENDPOINT);
console.log('[Appwrite Server Client] ✔ Project ID:', APPWRITE_PROJECT_ID);
console.log('[Appwrite Server Client] ✔ API Key present:', !!APPWRITE_API_KEY);

// ───────────────
// 2. INITIALIZE CLIENT
// ───────────────
const serverClient = new Client();

try {
  // In node‐appwrite, each setter returns “this,” so chaining works
  serverClient
    .setEndpoint(APPWRITE_ENDPOINT)       // e.g. "http://localhost/v1"
    .setProject(APPWRITE_PROJECT_ID)      // your Project ID
    .setKey(APPWRITE_API_KEY);            // your secret API key

  console.log('[Appwrite Server Client] ✔ Client configured successfully.');
} catch (err: any) {
  console.error('[Appwrite Server Client] ❌ FAILED TO CONFIGURE CLIENT:', err.message || err);
  throw new Error(`Failed to configure Appwrite client: ${err.message}`);
}

// ───────────────
// 3. EXPORT serverDatabases + TYPES/VALUES
// ───────────────

// Export the Databases instance for your API routes:
export const serverDatabases = new Databases(serverClient);

// Re‐export ID, Query, and AppwriteException so that callers can
// invoke `ServerID.unique()` and do `instanceof ServerAppwriteException`:
export { ID as ServerID, Query as ServerQuery, AppwriteException as ServerAppwriteException };

// (Optionally) If you need to export the raw client:
export { Client as ServerAppwriteClient };
