"use strict";

const sdk = require("node-appwrite");

/**
 * send-receipt-email
 * Trigger: Appwrite event on reservation document create
 * Responsibility: Send a branded receipt email to the user on successful booking/payment.
 */
module.exports = async ({ req, res, log, error }) => {
  try {
    log('[send-receipt-email] Execution started');
    // Prefer function-bound env in Appwrite, fallback to standard
    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
    const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
    const apiKey = process.env.APPWRITE_FUNCTION_API_KEY || process.env.APPWRITE_API_KEY;

    const DB_ID = process.env.APPWRITE_DATABASE_ID || process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const RESERVATIONS_COLLECTION_ID = process.env.APPWRITE_RESERVATIONS_COLLECTION_ID || process.env.NEXT_PUBLIC_APPWRITE_RESERVATIONS_COLLECTION_ID;

    if (!endpoint || !projectId || !apiKey || !DB_ID || !RESERVATIONS_COLLECTION_ID) {
      error("Missing required environment variables for send-receipt-email function.");
      return res.json({ success: false, error: "Function not configured." }, 500);
    }

    // Parse the Appwrite event payload (document JSON on create)
    let doc = null;
    // 1) Try request body
    try { doc = JSON.parse(req.body || "{}"); } catch (_) { doc = null; }
    if (doc) log('[send-receipt-email] Parsed body payload');
    // 2) Fallback to environment-provided event data
    if (!doc || !doc.$id) {
      try {
        const raw = process.env.APPWRITE_FUNCTION_EVENT_DATA || process.env.APPWRITE_EVENT_DATA; // older/alt var name
        if (raw) {
          const parsed = JSON.parse(raw);
          // Some runtimes wrap payload in { payload: {...} }
          doc = parsed && parsed.payload ? parsed.payload : parsed;
          if (doc) log('[send-receipt-email] Parsed APPWRITE_FUNCTION_EVENT_DATA payload');
        }
      } catch (_) { /* ignore */ }
    }

    // Initialize admin client for optional fallback fetch + messaging
    const client = new sdk.Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);
    const users = new sdk.Users(client);
    const messaging = new sdk.Messaging(client);
    const databases = new sdk.Databases(client);
    
    // 3) If still no doc, try to parse event string and fetch the document
    let evt = (req && req.headers && (req.headers["x-appwrite-event"] || req.headers["X-Appwrite-Event"])) || "";
    if (!evt) evt = process.env.APPWRITE_FUNCTION_EVENT || "";
    if ((!doc || !doc.$id) && evt) {
      try {
        const parts = evt.split('.');
        const idx = parts.indexOf('documents');
        const docId = (idx !== -1 && parts[idx + 1] && parts[idx + 1] !== '*') ? parts[idx + 1] : null;
        if (docId) {
          const fetched = await databases.getDocument(DB_ID, RESERVATIONS_COLLECTION_ID, docId);
          if (fetched && fetched.$id) { doc = fetched; log('[send-receipt-email] Fetched document by event docId'); }
        }
      } catch (_) { /* ignore */ }
    }

    // 4) Final check: if still no doc, allow manual exec only with reservation-like payload
    if (!doc || (!doc.userId && !doc.propertyName)) {
      error("No document payload received from event or body.");
      return res.json({ success: false, error: "No document payload." }, 400);
    }

    // Guard: ensure correct event source if event is present
    if (evt) {
      if (!evt.includes(`databases.${DB_ID}.collections.${RESERVATIONS_COLLECTION_ID}.documents`) || !evt.endsWith(".create")) {
        log(`Ignoring event '${evt}' not matching reservations.create.`);
        return res.json({ success: true, message: "Ignored non-reservation event." });
      }
    }

    const userId = doc.userId;
    if (!userId) {
      error("Reservation document missing userId; cannot send receipt.");
      return res.json({ success: false, error: "Missing userId on reservation document." }, 400);
    }

    // Fetch user details
    let user;
    try {
      user = await users.get(userId);
    } catch (e) {
      error("Failed to fetch user for receipt:", e);
      return res.json({ success: false, error: "User fetch failed." }, 500);
    }

    const recipientName = user.name || "Customer";
    const recipientEmail = (user.email || '').toLowerCase();
    log(`[send-receipt-email] Preparing email for user ${userId} (${recipientEmail || 'no-email'})`);

    // Brand colors (from styles/_variables.scss)
    const BRAND_PRIMARY = "#193C35";
    const BRAND_ACCENT = "#EDD3E3";
    const BRAND_GREY_TEXT = "#585858";
    const BRAND_BG = "#E3E5E6";

    // Extract fields from reservation document
    const amountPaid = Number(doc.amountPaid || 0) || 0;
    const amountFormatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amountPaid);
    const createdAt = doc.reservationTimestamp ? new Date(doc.reservationTimestamp) : new Date();
    const paidAtStr = createdAt.toLocaleString("en-IN", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    const propertyName = doc.propertyName || "Your Property";
    const roomType = `${doc.occupancyName || "Room"} - ${doc.selectedTierName || "Tier"}`;
    const paymentId = doc.razorpayPaymentId || "N/A";
    const orderId = doc.razorpayOrderId || "N/A";

    const subject = `Receipt: Booking Confirmed — ${propertyName}`;

    const html = `<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Payment Receipt</title>
    <style>
      body { margin:0; padding:0; background:${BRAND_BG}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, 'Helvetica Neue', 'Noto Sans', sans-serif; color:#111; }
      a { color:${BRAND_PRIMARY}; text-decoration: none; }
      .container { width: 100%; background:${BRAND_BG}; padding: 24px 0; }
      .card { max-width: 640px; margin: 0 auto; background:#fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #ececec; }
      .header { background:${BRAND_PRIMARY}; color:#fff; padding: 20px 24px; font-weight: 600; font-size: 18px; }
      .content { padding: 24px; }
      .greeting { margin: 0 0 16px; font-size: 16px; color:#111; }
      .lead { margin: 0 0 18px; color:${BRAND_GREY_TEXT}; line-height: 1.55; }
      .summary { border: 1px solid #eee; border-radius: 8px; overflow:hidden; margin: 18px 0; }
      .summary-title { background:${BRAND_ACCENT}; color:#111; padding: 12px 16px; font-weight: 600; }
      .row { display:flex; border-top:1px solid #f2f2f2; }
      .cell { flex:1; padding:12px 16px; font-size: 14px; }
      .cell.label { color:${BRAND_GREY_TEXT}; max-width:220px; }
      .amount { font-weight: 700; color:${BRAND_PRIMARY}; }
      .footer { padding: 20px 24px; color:${BRAND_GREY_TEXT}; font-size: 12px; border-top:1px solid #f2f2f2; }
    </style>
  </head>
  <body>
    <div class=\"container\">
      <div class=\"card\">
        <div class=\"header\">Booking Confirmed — Payment Receipt</div>
        <div class=\"content\">
          <p class=\"greeting\">Hi ${recipientName},</p>
          <p class=\"lead\">
            Thank you for your payment. Your booking has been confirmed.
            Our team will contact you shortly with the next steps.
          </p>

          <div class=\"summary\">
            <div class=\"summary-title\">Payment Summary</div>
            <div class=\"row\"><div class=\"cell label\">Amount Paid</div><div class=\"cell amount\">${amountFormatted}</div></div>
            <div class=\"row\"><div class=\"cell label\">Date</div><div class=\"cell\">${paidAtStr}</div></div>
            <div class=\"row\"><div class=\"cell label\">Payment ID</div><div class=\"cell\">${paymentId}</div></div>
            <div class=\"row\"><div class=\"cell label\">Order ID</div><div class=\"cell\">${orderId}</div></div>
            <div class=\"row\"><div class=\"cell label\">Property</div><div class=\"cell\">${propertyName}</div></div>
            <div class=\"row\"><div class=\"cell label\">Room Type</div><div class=\"cell\">${roomType}</div></div>
            <div class=\"row\"><div class=\"cell label\">Status</div><div class=\"cell\">Confirmed</div></div>
          </div>

          <p class=\"lead\">If we’re unable to resolve your booking within 24 hours, your payment will be refunded.</p>
          <p class=\"lead\">If you have any questions, contact us at <a href=\"mailto:support@hubodeliving.com\">support@hubodeliving.com</a>.</p>
        </div>
        <div class=\"footer\">This receipt is for your records. All amounts shown are in INR.</div>
      </div>
    </div>
  </body>
 </html>`;

    // Prefer explicit email target to avoid silent routing differences across versions
    try {
      const tmpTargetId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).slice(0, 24);
      if (!recipientEmail) {
        return res.json({ success: false, error: "Recipient has no email." }, 400);
      }
      await users.createTarget(userId, tmpTargetId, 'email', recipientEmail);
      const msg = await messaging.createEmail(
        sdk.ID.unique(),
        subject,
        html,
        [],                // topics
        [],                // users
        [tmpTargetId],     // targets
        [],                // cc
        [],                // bcc
        [],                // attachments
        false,             // draft
        true               // html
      );
      // Best-effort cleanup of temp target
      try { await users.deleteTarget(userId, tmpTargetId); } catch (_) {}
      log(`[send-receipt-email] Email queued via targets[], messageId=${msg && msg.$id ? msg.$id : 'unknown'}`);
      return res.json({ success: true, message: "Receipt email sent (targets)." });
    } catch (e) {
      error('[send-receipt-email] Sending via targets[] failed:', e);
      return res.json({ success: false, error: "Email send failed." }, 500);
    }
  } catch (e) {
    error("Unhandled error in send-receipt-email:", e);
    return res.json({ success: false, error: "Unhandled error." }, 500);
  }
};
