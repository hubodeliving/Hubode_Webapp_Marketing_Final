// app/api/request-email-change/route.ts

import { NextResponse } from "next/server";
import { Client, Account, Databases, Query } from "node-appwrite";

export const runtime = "nodejs";

const {
  NEXT_PUBLIC_APPWRITE_ENDPOINT,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID,               // “profiles” collection
  NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
  NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID, // “emailChangeRequests” collection
  NEXT_PUBLIC_APPWRITE_EMAIL_TOKEN_TTL_MS,         // e.g. "900000"
} = process.env;

// 1. Validate required ENV vars
if (
  !NEXT_PUBLIC_APPWRITE_ENDPOINT ||
  !NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  !APPWRITE_API_KEY ||
  !NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
  !NEXT_PUBLIC_APPWRITE_COLLECTION_ID ||
  !NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID ||
  !NEXT_PUBLIC_APPWRITE_EMAIL_TOKEN_TTL_MS
) {
  console.error(
    "[request-email-change] Missing required ENV vars:",
    {
      NEXT_PUBLIC_APPWRITE_ENDPOINT,
      NEXT_PUBLIC_APPWRITE_PROJECT_ID,
      APPWRITE_API_KEY: APPWRITE_API_KEY ? "DEFINED" : "UNDEFINED",
      NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      NEXT_PUBLIC_APPWRITE_COLLECTION_ID,
      NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID,
      NEXT_PUBLIC_APPWRITE_EMAIL_TOKEN_TTL_MS,
    }
  );
}

// 2. Initialize Appwrite Node SDK client
const serverClient = new Client()
  .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(APPWRITE_API_KEY!);

const accountAdmin = new Account(serverClient);
const databasesAdmin = new Databases(serverClient);

// 3. Parse TTL
const rawTtl = NEXT_PUBLIC_APPWRITE_EMAIL_TOKEN_TTL_MS;
const TOKEN_TTL_MS = rawTtl ? parseInt(rawTtl, 10) : NaN;
if (isNaN(TOKEN_TTL_MS)) {
  console.error(
    "[request-email-change] Invalid TTL value:",
    NEXT_PUBLIC_APPWRITE_EMAIL_TOKEN_TTL_MS
  );
}

export async function POST(req: Request) {
  try {
    // 4. Parse JSON body
    let bodyData: { userId?: string; newEmail?: string };
    try {
      bodyData = await req.json();
    } catch (parseErr) {
      console.error("[request-email-change] Invalid JSON body:", parseErr);
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const { userId, newEmail } = bodyData;
    console.log("[request-email-change] Received:", { userId, newEmail });

    if (!userId || !newEmail) {
      console.warn("[request-email-change] Missing userId or newEmail");
      return NextResponse.json(
        { error: "userId and newEmail are required." },
        { status: 400 }
      );
    }

    // 5. Check if newEmail already exists in “profiles”
    let existingProfile;
    try {
      existingProfile = await databasesAdmin.listDocuments(
        NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
        [Query.equal("email", newEmail)]
      );
    } catch (dbErr) {
      console.error(
        "[request-email-change] Error querying profiles collection:",
        dbErr
      );
      return NextResponse.json(
        { error: "Error checking if email is already in use." },
        { status: 500 }
      );
    }

    if (existingProfile.total > 0) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 }
      );
    }

    // 6. Optional safeguard: check “emailChangeRequests” for unexpired token
    const cutoffTimestamp = !isNaN(TOKEN_TTL_MS)
      ? Date.now() - TOKEN_TTL_MS
      : 0;
    if (isNaN(TOKEN_TTL_MS)) {
      console.warn(
        "[request-email-change] Using cutoffTimestamp=0 because TTL was invalid."
      );
    }

    let existingRequest;
    try {
      existingRequest = await databasesAdmin.listDocuments(
        NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID!,
        [
          Query.equal("userId", userId),
          Query.equal("newEmail", newEmail),
          Query.greaterThan("createdAt", cutoffTimestamp),
        ]
      );
    } catch (reqErr) {
      console.error(
        "[request-email-change] Error querying emailChangeRequests:",
        reqErr
      );
      return NextResponse.json(
        { error: "Error checking existing email-change request." },
        { status: 500 }
      );
    }

    if (existingRequest.total > 0) {
      // If an unexpired request exists, simply return OK and do not call createEmailToken
      console.log(
        "[request-email-change] Found unexpired request; skipping token creation."
      );
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 7. Create a new Appwrite email-token (magic link)
    try {
      await accountAdmin.createEmailToken(userId, newEmail);
    } catch (tokenErr: any) {
      // NOTE: If this ever throws 409 Duplicate, it means someone bypassed client cooldown.
      // We catch it and return OK so the user doesn’t see a 500.
      const isDuplicate =
        tokenErr.code === 409 ||
        (typeof tokenErr.message === "string" &&
          tokenErr.message.includes("Document already exists"));

      if (isDuplicate) {
        console.log(
          "[request-email-change] Duplicate token exists; skipping creation."
        );
      } else {
        console.error(
          "[request-email-change] createEmailToken failed unexpectedly:",
          tokenErr
        );
        const message =
          typeof tokenErr.message === "string"
            ? tokenErr.message
            : "Failed to create email-change token.";
        return NextResponse.json(
          { error: `Appwrite error: ${message}` },
          { status: 500 }
        );
      }
    }

    // 8. Log this new request in “emailChangeRequests”
    try {
      await databasesAdmin.createDocument(
        NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
        NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID!,
        "unique()",
        {
          userId,
          newEmail,
          createdAt: Date.now(), // MUST be numeric (Int)
        }
      );
    } catch (logErr) {
      console.error(
        "[request-email-change] Error writing to emailChangeRequests:",
        logErr
      );
      // We still return OK; token was created or was already pending.
    }

    // 9. Return success
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("[request-email-change] Unexpected error:", err);
    const errorMessage =
      typeof err.message === "string"
        ? err.message
        : "An unexpected error occurred.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
