"use strict";

const sdk = require("node-appwrite");

// This function INITIATES email change by sending a numeric OTP
// to the NEW email and storing it server-side for later verification.
// Verification is handled by your Next API at /api/email-change/verify.

module.exports = async ({ req, res, log, error }) => {
  const {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    APPWRITE_DATABASE_ID,
    APPWRITE_EMAIL_CHANGE_COLLECTION_ID,
  } = process.env;

  if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY || !APPWRITE_DATABASE_ID || !APPWRITE_EMAIL_CHANGE_COLLECTION_ID) {
    error("[initiate-email-change] Missing environment variables");
    return res.json({ success: false, message: "Function not configured." }, 500);
  }

  // Parse input
  let body = {};
  try { body = JSON.parse(req.body || "{}"); } catch (_) {}
  const userId = (body.userId || "").trim();
  const newEmail = (body.newEmail || "").trim().toLowerCase();

  if (!userId || !newEmail) {
    return res.json({ success: false, message: "userId and newEmail are required." }, 400);
  }

  // Setup admin client
  const client = new sdk.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const messaging = new sdk.Messaging(client);
  const users = new sdk.Users(client);

  // Generate 6-digit numeric OTP, 5-minute TTL
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  // Store OTP for verification step
  try {
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_EMAIL_CHANGE_COLLECTION_ID,
      sdk.ID.unique(),
      {
        userId,
        newEmail,
        otp,
        used: false,
        createdAt: Date.now(),
        expiresAt
      }
    );
  } catch (e) {
    error("[initiate-email-change] Failed to persist OTP:", e);
    return res.json({ success: false, message: "Failed to prepare OTP." }, 500);
  }

  // Email the OTP to the NEW email
  try {
    // Create a temporary messaging target for this user's new email
    // providerType 'email' is accepted in current SDKs; providerId is optional
    const targetId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).slice(0, 24);
    await users.createTarget(userId, targetId, 'email', newEmail);

    await messaging.createEmail(
      sdk.ID.unique(),
      "Verify Email Change",
      `Your code to confirm email change to <strong>${newEmail}</strong> is: <strong>${otp}</strong><br/><br/>This code will expire in 5 minutes.`,
      [],
      [],
      [targetId],
      [],
      [],
      [],
      false,
      true
    );

    // Cleanup target best-effort
    try { await users.deleteTarget(userId, targetId); } catch (_) {}
  } catch (e) {
    error("[initiate-email-change] Failed to send email:", e);
    return res.json({ success: false, message: "Failed to send OTP email." }, 500);
  }

  return res.json({ success: true, message: `OTP sent to ${newEmail}` }, 200);
};
