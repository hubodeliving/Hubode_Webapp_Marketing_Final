// app/api/confirm-email-change/route.ts

import { NextResponse } from "next/server";
import { Client, Account, Databases, Query } from "node-appwrite";

export const runtime = "nodejs";

const {
  NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
  NEXT_PUBLIC_APPWRITE_PROJECT_URL
} = process.env;

if (
  !NEXT_PUBLIC_APPWRITE_ENDPOINT ||
  !NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  !APPWRITE_API_KEY ||
  !NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
  !NEXT_PUBLIC_APPWRITE_COLLECTION_ID
) {
  console.error(
    "[confirm-email-change] One or more ENV vars are missing:",
    {
      NEXT_PUBLIC_APPWRITE_ENDPOINT,
      NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      APPWRITE_API_KEY: APPWRITE_API_KEY ? "DEFINED" : "UNDEFINED",
      NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
    }
  );
}

const serverClient = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(APPWRITE_API_KEY!);

const accountAdmin = new Account(serverClient);
const databasesAdmin = new Databases(serverClient);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId")!;
  const email = url.searchParams.get("email")!;
  const secret = url.searchParams.get("secret")!;

  // 1) Verify the magic link and update Appwrite Auth email
  try {
    await accountAdmin.updateEmail(email, secret);
    console.log(
      "[confirm-email-change] accountAdmin.updateEmail succeeded:",
      { userId, email }
    );
  } catch (err: any) {
    console.error("[confirm-email-change] updateEmail error:", err);
    const errorMessage =
      typeof err.message === "string"
        ? err.message
        : "Failed to verify email-change token.";
    return NextResponse.redirect(
      `${NEXT_PUBLIC_APPWRITE_PROJECT_URL}/profile/edit?error=${encodeURIComponent(
        errorMessage
      )}`
    );
  }

  // 2) Mirror the change into your “profiles” collection
  try {
    const profile = await databasesAdmin.listDocuments(
      NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
      NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
      [Query.equal("userId", userId)]
    );

    if (profile.total > 0) {
      await databasesAdmin.updateDocument(
        NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        profile.documents[0].$id,
        { email }
      );
      console.log(
        "[confirm-email-change] Updated profiles documentId:",
        profile.documents[0].$id,
        "→ new email:",
        email
      );
    } else {
      console.warn(
        "[confirm-email-change] No profile document found for userId:",
        userId
      );
    }
  } catch (syncErr: any) {
    console.error(
      "[confirm-email-change] Error syncing to profiles collection:",
      syncErr
    );
    // Not fatal: Auth email was updated. User can still log in—but your DB is temporarily out of sync.
  }

  // 3) Redirect back into the app with a success flag
  return NextResponse.redirect(
    `${NEXT_PUBLIC_APPWRITE_PROJECT_URL}/profile?email_updated=true`
  );
}
