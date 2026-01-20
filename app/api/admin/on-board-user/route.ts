// File: app/api/admin/on-board-user/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Import our “serverDatabases” instance, plus re-exported ID and Exception:
import {
  serverDatabases,
  ServerID,
  ServerAppwriteException,
} from '@/lib/appwrite.server';

import { client as sanityWriteClient } from '@/lib/sanity.client.server';

const APPWRITE_DATABASE_ID             = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_PROFILES_COLLECTION_ID  = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;

interface OnboardingApiPayload {
  appwriteAuthUserId: string;
  sanityPropertyId: string;
  sanityPropertyName: string;
  sanityOccupancyGroupKey: string;
  occupancyName: string;
  sanityRoomTierKey: string;
  tierName: string;
  rentAmount: number;
  currency: string;
}

export async function POST(req: NextRequest) {
  console.log('[API Onboard] Received POST request.');

  try {
    // 1. Ensure we have all required Appwrite IDs
    if (
      !APPWRITE_DATABASE_ID ||
      !APPWRITE_PROFILES_COLLECTION_ID ||
      !APPWRITE_TENANCIES_COLLECTION_ID
    ) {
      throw new Error('Server config error: missing Appwrite database/collection IDs.');
    }
    // 2. Ensure Sanity is configured
    if (
      !process.env.SANITY_API_WRITE_TOKEN ||
      !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    ) {
      throw new Error('Server config error: missing Sanity env vars.');
    }

    // 3. Parse and validate the JSON payload
    const payload = (await req.json()) as OnboardingApiPayload;
    console.log('[API Onboard] Payload:', JSON.stringify(payload, null, 2));

    const {
      appwriteAuthUserId,
      sanityPropertyId,
      sanityPropertyName,
      sanityOccupancyGroupKey,
      occupancyName,
      sanityRoomTierKey,
      tierName,
      rentAmount,
      currency,
    } = payload;

    if (
      !appwriteAuthUserId ||
      !sanityPropertyId ||
      !sanityOccupancyGroupKey ||
      !sanityRoomTierKey ||
      typeof rentAmount !== 'number' ||
      rentAmount <= 0
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid required onboarding data.' },
        { status: 400 }
      );
    }

    const profileDocId      = appwriteAuthUserId;
    const tenancyRentAmount = Math.round(rentAmount);

    // 4. Create a new “Tenancies” document in Appwrite
    const newTenancyData = {
      userId: appwriteAuthUserId,
      profileDocId,
      sanityPropertyId,
      sanityPropertyName,
      sanityOccupancyGroupKey,
      occupancyName,
      sanityRoomTierKey,
      tierName,
      rentAmount: tenancyRentAmount,
      currency: currency || 'INR',
      onboardingDate: new Date().toISOString(),
      status: 'Active',
      // (Add other optional fields if needed)
    };

    console.log('[API Onboard] Creating tenancy:', newTenancyData);
    const tenancyDocument = await serverDatabases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_TENANCIES_COLLECTION_ID,
      ServerID.unique(),
      newTenancyData
    );
    console.log('[API Onboard] Tenancy document created:', tenancyDocument.$id);

    // 5. Update the “profiles” document in Appwrite
    const profileUpdateData = {
      isBoarded: true,
      stayingPropertyName: sanityPropertyName,
      stayingRoomType: occupancyName,
      stayingRoomTier: tierName,
      stayingRent: tenancyRentAmount,
    };

    console.log(`[API Onboard] Updating profile ${profileDocId}:`, profileUpdateData);
    await serverDatabases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_PROFILES_COLLECTION_ID,
      profileDocId,
      profileUpdateData
    );
    console.log(`[API Onboard] Profile ${profileDocId} updated successfully.`);

    // 6. Deduct one bed from Sanity’s “bedsLeft” in the matching tier
    try {
      console.log(
        `[API Onboard] Patching Sanity ${sanityPropertyId}, tier ${sanityRoomTierKey}.`
      );
      await sanityWriteClient
        .patch(sanityPropertyId)
        .dec({
          [`roomTypes[].tiers[_key=="${sanityRoomTierKey}"].bedsLeft`]: 1,
        })
        .commit({ autoGenerateArrayKeys: false });
      console.log('[API Onboard] Sanity bedsLeft updated.');
    } catch (sanityError: any) {
      console.error('[API Onboard] WARNING: Failed to update bedsLeft in Sanity:', sanityError.message || sanityError);
    }

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'User onboarded successfully!',
        tenancyId: tenancyDocument.$id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[API Onboard] Error in POST handler:', err);

    let errorMessage = err.message || 'Internal server error during onboarding.';
    if (err instanceof ServerAppwriteException) {
      errorMessage = `Appwrite Error: ${err.message} (Code: ${err.code}, Type: ${err.type})`;
    }

    return NextResponse.json(
      { error: 'Failed to on-board user.', details: errorMessage },
      { status: 500 }
    );
  }
}
