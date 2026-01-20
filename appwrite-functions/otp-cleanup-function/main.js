"use strict";

const sdk = require("node-appwrite");

module.exports = async ({ log, error, context }) => {
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
        // Always return an empty response object!
        return context && context.res && context.res.empty ? context.res.empty() : {};
    }

    const client = new sdk.Client()
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID)
        .setKey(APPWRITE_API_KEY);

    const databases = new sdk.Databases(client);
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    let deleted = 0;

    // 1. Delete expired OTPs
    let moreExpired = true;
    let cursorExpired = null;
    while (moreExpired) {
        try {
            let expiredQuery = [
                sdk.Query.lessThan("expiresAt", cutoff),
                sdk.Query.limit(100)
            ];
            if (cursorExpired) expiredQuery.push(sdk.Query.cursorAfter(cursorExpired));
            const expired = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_OTP_COLLECTION_ID,
                expiredQuery
            );
            if (!expired.documents.length) break;
            for (const doc of expired.documents) {
                await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_OTP_COLLECTION_ID, doc.$id);
                deleted++;
                log(`Deleted expired OTP doc ${doc.$id}`);
            }
            cursorExpired = expired.documents[expired.documents.length - 1].$id;
            moreExpired = expired.documents.length === 100;
        } catch (e) {
            error("Error deleting expired OTP docs:", e.message || e);
            moreExpired = false;
        }
    }

    // 2. Delete used OTPs
    let moreUsed = true;
    let cursorUsed = null;
    while (moreUsed) {
        try {
            let usedQuery = [
                sdk.Query.equal("used", true),
                sdk.Query.limit(100)
            ];
            if (cursorUsed) usedQuery.push(sdk.Query.cursorAfter(cursorUsed));
            const usedDocs = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_OTP_COLLECTION_ID,
                usedQuery
            );
            if (!usedDocs.documents.length) break;
            for (const doc of usedDocs.documents) {
                await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_OTP_COLLECTION_ID, doc.$id);
                deleted++;
                log(`Deleted used OTP doc ${doc.$id}`);
            }
            cursorUsed = usedDocs.documents[usedDocs.documents.length - 1].$id;
            moreUsed = usedDocs.documents.length === 100;
        } catch (e) {
            error("Error deleting used OTP docs:", e.message || e);
            moreUsed = false;
        }
    }

    log(`OTP cleanup complete. Deleted ${deleted} old OTP docs.`);

    // Fix: Always return empty response
    return context && context.res && context.res.empty ? context.res.empty() : {};
};
