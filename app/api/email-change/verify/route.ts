import { NextResponse } from "next/server";
import { Client, Users, Databases, Query } from "node-appwrite";

export const runtime = "nodejs";

const {
    NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    NEXT_PUBLIC_APPWRITE_DATABASE_ID,
    NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID,
    NEXT_PUBLIC_APPWRITE_COLLECTION_ID // profiles collection
} = process.env;

function endpoint() {
    let ep = (NEXT_PUBLIC_APPWRITE_ENDPOINT || "").trim();
    if (!ep || ep.startsWith("http://localhost"))
        ep = "http://72.60.205.234:81/v1";
    return ep;
}

export async function POST(req: Request) {
    if (!APPWRITE_API_KEY || !NEXT_PUBLIC_APPWRITE_PROJECT_ID) {
        return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    let body: { userId?: string; newEmail?: string; otp?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 400 }); }

    const userId = (body.userId || "").trim();
    const newEmail = (body.newEmail || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();

    if (!userId || !newEmail || !otp) {
        return NextResponse.json({ error: "userId, newEmail, otp are required." }, { status: 400 });
    }
    if (!/^[0-9]{6}$/.test(otp)) {
        return NextResponse.json({ error: "OTP must be 6 digits." }, { status: 400 });
    }

    const client = new Client()
        .setEndpoint(endpoint())
        .setProject(NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
        .setKey(APPWRITE_API_KEY!);

    const users = new Users(client);
    const db = new Databases(client);

    // 1) Find valid OTP doc
    let docs;
    try {
        docs = await db.listDocuments(
            NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID!,
            [
                Query.equal("userId", userId),
                Query.equal("newEmail", newEmail),
                Query.equal("otp", otp),
                Query.equal("used", false),
                Query.orderDesc("$createdAt"),
                Query.limit(1)
            ]
        );
    } catch (e: any) {
        return NextResponse.json({ error: "OTP lookup failed." }, { status: 500 });
    }

    if (!docs || docs.total === 0) {
        return NextResponse.json({ error: "Invalid or already used OTP." }, { status: 400 });
    }

    const doc = docs.documents[0] as any;
    const now = Date.now();
    if (doc.expiresAt < now) {
        return NextResponse.json({ error: "OTP expired." }, { status: 400 });
    }

    // 2) Update auth email (admin)
    try {
        await users.updateEmail(userId, newEmail);
    } catch (e: any) {
        return NextResponse.json({ error: "Failed to update auth email." }, { status: 500 });
    }

    // 2b) Mark email verified, since OTP was just validated
    try {
        await users.updateEmailVerification(userId, true);
    } catch (_) {
        // Not fatal; proceed even if verification flag update lags
    }

    // 3) Mark OTP as used
    try {
        await db.updateDocument(
            NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            NEXT_PUBLIC_APPWRITE_EMAIL_CHANGE_COLLECTION_ID!,
            doc.$id,
            { used: true }
        );
    } catch {}

    // 4) Mirror to profiles collection (best-effort)
    try {
        const profs = await db.listDocuments(
            NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            NEXT_PUBLIC_APPWRITE_COLLECTION_ID!, // profiles
            [Query.equal("userId", userId), Query.limit(1)]
        );
        if (profs.total > 0) {
            await db.updateDocument(
                NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
                NEXT_PUBLIC_APPWRITE_COLLECTION_ID!,
                profs.documents[0].$id,
                { email: newEmail }
            );
        }
    } catch {}

    return NextResponse.json({ ok: true }, { status: 200 });
}
