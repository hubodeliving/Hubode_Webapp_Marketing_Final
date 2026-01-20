import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Query, Account } from 'node-appwrite';
import { cookies } from 'next/headers';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const OTP_COLL_ID = process.env.APPWRITE_OTP_COLLECTION_ID!;

export async function POST(request: NextRequest) {
  try {
    const { userId, verificationToken } = await request.json();

    if (!userId || !verificationToken) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    // Create admin client
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const databases = new Databases(adminClient);

    // Verify the verification token
    const result = await databases.listDocuments(DB_ID, OTP_COLL_ID, [
      Query.equal('userId', userId),
      Query.equal('otp', verificationToken),
      Query.equal('used', false),
      Query.orderDesc('$createdAt'),
      Query.limit(1),
    ]);

    if (result.documents.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token.' },
        { status: 400 }
      );
    }

    const tokenDoc = result.documents[0];
    const now = Date.now();

    if (tokenDoc.expiresAt < now) {
      return NextResponse.json(
        { success: false, message: 'Verification token has expired.' },
        { status: 400 }
      );
    }

    // Mark token as used
    await databases.updateDocument(DB_ID, OTP_COLL_ID, tokenDoc.$id, {
      used: true,
    });

    // ✅ IMPORTANT: Create an actual Appwrite session using Admin API
    // This is a workaround - we'll create an anonymous token that the client can use
    const userClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
    
    const account = new Account(userClient);
    
    // Create an anonymous session first, then convert it to a user session
    // Note: This is a limitation - Appwrite doesn't allow server-side password session creation
    // without the actual password. Alternative: Use JWT tokens
    
    // For now, return success and let the frontend handle session creation
    // using the standard Appwrite flow with a temporary password or magic URL

    return NextResponse.json({
      success: true,
      message: 'Verification successful. Please complete login.',
      userId: userId,
      // Note: You'll need to handle the actual session creation differently
      // See alternative approach below
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create session.' },
      { status: 500 }
    );
  }
}
