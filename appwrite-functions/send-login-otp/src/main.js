"use strict";

const sdk = require("node-appwrite");

/**
 * One function: send + verify numeric OTP for login.
 * If mode == "send", sends OTP to user (via Appwrite Messaging).
 * If mode == "verify", verifies OTP, marks used, and returns session tokens.
 */
module.exports = async({ req, res, log, error }) => {
    const {
        APPWRITE_ENDPOINT,
        APPWRITE_PROJECT_ID,
        APPWRITE_API_KEY,
        APPWRITE_DATABASE_ID,
        APPWRITE_OTP_COLLECTION_ID
    } = process.env;

    if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY ||
        !APPWRITE_DATABASE_ID || !APPWRITE_OTP_COLLECTION_ID) {
        error("Missing ENV(s).");
        return res.json({ success: false, message: "Function not configured." }, 500);
    }

    const client = new sdk.Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const users = new sdk.Users(client);
    const databases = new sdk.Databases(client);
    const messaging = new sdk.Messaging(client);

    // Parse body
    let body = {};
    try { body = JSON.parse(req.body || "{}"); } catch (_) {}
    const mode = (body.mode || "send").toLowerCase();

    const incomingUserId = body.userId ? String(body.userId) : null;
    const incomingEmail = body.email ? String(body.email).trim().toLowerCase() : null;
    const otpVal = body.otp ? String(body.otp).trim() : null;

    // --- SEND OTP MODE ---
    if (mode === "send") {
        if (!incomingUserId && !incomingEmail) {
            return res.json({ success: false, message: "userId or email required." }, 400);
        }

        // Resolve user by userId or email
        let user = null;
        try {
            if (incomingUserId) {
                user = await users.get(incomingUserId);
            } else {
                const list = await users.list({ search: incomingEmail });
                if (list && Array.isArray(list.users)) {
                    user = list.users.find(u => (u.email || "").toLowerCase() === incomingEmail) || null;
                }
            }
        } catch (e) {
            error("User lookup failed:", e);
        }
        if (!user) return res.json({ success: false, message: "User not found." }, 404);

        const userId = user.$id;
        const email = (user.email || "").toLowerCase();

        // Generate numeric OTP
        const otp = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6 digits
        const isNumeric = /^[0-9]{6}$/.test(otp);
        const expiresAt = Date.now() + (5 * 60 * 1000);

        log("NUMERIC OTP GENERATED:", { userId, otp, isNumeric, expiresAt });

        // Persist OTP for later verification/re-use protection
        try {
            await databases.createDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_OTP_COLLECTION_ID,
                sdk.ID.unique(), { userId, otp, expiresAt, used: false }
            );
        } catch (e) {
            error("Failed to save OTP:", e);
            return res.json({ success: false, message: "Failed to save OTP." }, 500);
        }

        // Email OTP (Appwrite Messaging)
        try {
            await messaging.createEmail(
                sdk.ID.unique(),
                "Login OTP (NUMERIC)",
                `Your Hubode login OTP is: <strong>${otp}</strong><br/><br/>This code will expire in 5 minutes.`, [], [userId], [], [], [], [],
                false,
                true
            );
            log("Numeric OTP email sent:", { userId, email });
            return res.json({ success: true, message: `Numeric OTP sent to ${email}` });
        } catch (e) {
            error("Failed to send email:", e);
            return res.json({ success: false, message: "Failed to send OTP email." }, 500);
        }
    }

    // --- VERIFY OTP MODE ---
    if (mode === "verify") {
        if (!incomingUserId || !otpVal) {
            return res.json({ success: false, message: "userId and otp required." }, 400);
        }
        if (!/^[0-9]{6}$/.test(otpVal)) {
            return res.json({ success: false, message: "OTP must be 6 digits." }, 400);
        }

        // Lookup OTP in database
        let otpDocs = [];
        try {
            const result = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_OTP_COLLECTION_ID, [
                    sdk.Query.equal("userId", incomingUserId),
                    sdk.Query.equal("otp", otpVal),
                    sdk.Query.equal("used", false),
                    sdk.Query.orderDesc("$createdAt"),
                    sdk.Query.limit(1),
                ]
            );
            otpDocs = result.documents || [];
        } catch (e) {
            error("Failed to query OTP documents:", e);
            return res.json({ success: false, message: "OTP lookup failed." }, 500);
        }
        if (otpDocs.length === 0) {
            return res.json({ success: false, message: "Invalid or expired OTP." }, 400);
        }
        const otpDoc = otpDocs[0];
        const now = Date.now();
        if (otpDoc.expiresAt < now) {
            return res.json({ success: false, message: "OTP has expired." }, 400);
        }

        // Mark OTP as used
        try {
            await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_OTP_COLLECTION_ID,
                otpDoc.$id, { used: true }
            );
        } catch (e) {
            error("Failed to mark OTP used.", e);
            return res.json({ success: false, message: "Failed to mark OTP used." }, 500);
        }

        // Get user object for token session
        let user = null;
        try {
            user = await users.get(incomingUserId);
        } catch (e) {
            error("User not found for token/session.", e);
            return res.json({ success: false, message: "User not found." }, 404);
        }

        // Create a magic link/session token for Appwrite session
        try {
            const token = await users.createToken(user.$id);
            log("OTP Verified/Magic token created", { userId: user.$id, tokenId: token.$id });
            return res.json({
                success: true,
                message: "OTP verified.",
                userId: user.$id,
                secret: token.secret
            });
        } catch (e) {
            error("Failed to create session token.", e);
            return res.json({ success: false, message: "Failed to create session token." }, 500);
        }
    }

    // If mode is unknown
    return res.json({ success: false, message: "Unknown mode. Use 'send' or 'verify'." }, 400);
};