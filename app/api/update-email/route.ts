// File: app/api/update-email/route.ts
import { NextResponse } from "next/server";
import { Client, Users, Messaging } from "node-appwrite";

export const runtime = "nodejs";

// —————————————————————————————————————————————
// ENV
// —————————————————————————————————————————————
const {
    NEXT_PUBLIC_APPWRITE_ENDPOINT,      // public API endpoint (e.g. https://api.yourdomain.tld/v1)
    NEXT_PUBLIC_APPWRITE_PROJECT_ID,    // project id
    APPWRITE_API_KEY,                   // admin API key (must allow users.* and messaging.emails.create)
} = process.env;

// small guard/helper so we never fall back to localhost silently
function resolveEndpoint() {
    let ep = (NEXT_PUBLIC_APPWRITE_ENDPOINT || "").trim();
    if (!ep || ep.startsWith("http://localhost")) {
        // *** REPLACE THIS with your public Appwrite endpoint (include /v1) ***
        ep = "https://YOUR-APPWRITE-ENDPOINT.TLD/v1";
    }
    return ep;
}

// —————————————————————————————————————————————
// POST /api/update-email
// Body: { userId: string, newEmail: string }
// Behavior: creates an email-change token server-side and emails the OTP to NEW email.
// Final update happens client-side via account.updateEmail(newEmail, secret).
// —————————————————————————————————————————————
export async function POST(req: Request) {
    // Validate env at runtime (don’t block Next build)
    if (!NEXT_PUBLIC_APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
        return NextResponse.json(
            { error: "Server not configured: missing project id or API key." },
            { status: 500 }
        );
    }

    const endpoint = resolveEndpoint();

    // Admin client
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const users = new Users(client);
    const messaging = new Messaging(client);

    // Parse body
    let body: { userId?: string; newEmail?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Request body must be valid JSON." },
            { status: 400 }
        );
    }

    const userId = (body.userId || "").trim();
    const newEmail = (body.newEmail || "").trim().toLowerCase();

    if (!userId || !newEmail) {
        return NextResponse.json(
            { error: "userId and newEmail are required." },
            { status: 400 }
        );
    }

    // Ensure user exists
    try {
        await users.get(userId);
    } catch (e: any) {
        return NextResponse.json(
            { error: "User not found." },
            { status: 404 }
        );
    }

    // Create email-change token (server/admin – returns secret)
    let token: any;
    try {
        // NOTE: Users API (admin) uses positional args here
        token = await users.createEmailToken(userId, newEmail);
        if (!token || !token.secret) {
            throw new Error("No secret returned by createEmailToken");
        }
    } catch (e: any) {
        return NextResponse.json(
            { error: "Failed to create email-change token." },
            { status: 500 }
        );
    }

    // Email the OTP to the NEW email address
    try {
        await messaging.createEmail(
            // messageId
            (Messaging as any).ID ? (Messaging as any).ID.unique() : (require("node-appwrite").ID).unique(),
            // subject
            "Email Change OTP",
            // html body
            `Your code to confirm email change to <strong>${newEmail}</strong> is: <strong>${token.secret}</strong><br/><br/>This code will expire soon.`,
            // topics
            [],
            // users (NONE; we’re sending to a raw email target)
            [],
            // targets: send directly to new email
            [{ email: newEmail }],
            // cc, bcc, attachments
            [],
            [],
            [],
            // draft, html
            false,
            true
        );
    } catch (e: any) {
        return NextResponse.json(
            { error: "Failed to send OTP email to new address." },
            { status: 500 }
        );
    }

    // Success: client should now route to /verify-otp?redirect=email-change
    // and call account.updateEmail(newEmail, secret) using the code they typed.
    return NextResponse.json(
        { ok: true, message: "OTP sent to new email." },
        { status: 200 }
    );
}
