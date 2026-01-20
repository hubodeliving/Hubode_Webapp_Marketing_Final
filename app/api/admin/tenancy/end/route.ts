// File: app/api/admin/tenancy/end/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases } from '@/lib/appwrite.server'; // Your server-side Appwrite client
import { AppwriteException } from 'appwrite';

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!; // Your profiles collection ID

interface EndTenancyPayload {
  tenancyId: string;
  profileDocId: string;
}

export async function POST(req: NextRequest) {
  console.log("[API EndTenancy] Received request.");
  // TODO: Add admin authentication/authorization check here
  // For example, verify a JWT from an admin session or check Appwrite session for admin label/team

  try {
    if (!APPWRITE_DATABASE_ID || !APPWRITE_TENANCIES_COLLECTION_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
      throw new Error("Critical: Server config error (Appwrite DB/Collection IDs missing).");
    }

    const payload = (await req.json()) as EndTenancyPayload;
    console.log("[API EndTenancy] Parsed payload:", payload);

    if (!payload.tenancyId || !payload.profileDocId) {
      return NextResponse.json({ error: 'Missing tenancyId or profileDocId.' }, { status: 400 });
    }

    // Step 1: Delete the tenancy document
    console.log(`[API EndTenancy] Deleting Tenancy Doc ID: ${payload.tenancyId}`);
    await serverDatabases.deleteDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_TENANCIES_COLLECTION_ID,
      payload.tenancyId
    );
    console.log(`[API EndTenancy] Tenancy document ${payload.tenancyId} deleted successfully.`);

    // Step 2: Update the user's profile document
    // Based on your profile attributes, you want to set `isBoarded` to false
    // and clear staying-related fields.
    const profileUpdateData = {
      isBoarded: false,
      stayingPropertyName: null, // Or "" if your schema prefers empty strings over null
      stayingRoomType: null,
      stayingRoomTier: null,
      stayingRent: null, // Or 0 if it's an integer and cannot be null
    };
    console.log(`[API EndTenancy] Updating Profile Doc ID: ${payload.profileDocId} with data:`, profileUpdateData);
    await serverDatabases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_PROFILES_COLLECTION_ID,
      payload.profileDocId,
      profileUpdateData
    );
    console.log(`[API EndTenancy] Profile document ${payload.profileDocId} updated successfully.`);

    return NextResponse.json({ success: true, message: 'Tenancy ended and profile updated successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('[API EndTenancy] Error:', error);
    let errorMessage = 'Internal server error while ending tenancy.';
    let statusCode = 500;

    if (error instanceof AppwriteException) {
        errorMessage = `Appwrite Error: ${error.message} (Code: ${error.code}, Type: ${error.type})`;
        if (error.code === 404) {
            errorMessage = `Appwrite Error: Resource not found (Code: 404). Tenancy or Profile document may already be deleted or ID is incorrect.`;
            statusCode = 404;
        } else if (error.code === 400) {
            statusCode = 400;
        }
        if (error.type) console.error(`[API EndTenancy] Appwrite Error Type: ${error.type}`);
    } else if (error.message.startsWith("Critical:")) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: 'Failed to end tenancy.', details: errorMessage }, { status: statusCode });
  }
}

