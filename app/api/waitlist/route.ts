import { NextResponse } from 'next/server';
import { escapeHtml, sendBrevoEmail } from '@/lib/brevo';
import { appendWaitlistEntry } from '@/lib/googleSheets';

export const runtime = 'nodejs';

interface WaitlistRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  occupation?: string;
  comingFrom?: string;
  moveInTimeline?: string;
  source?: string;
  propertyName?: string;
  propertyLocation?: string;
  roomType?: string;
  roomRate?: string;
}

function sanitize(value?: string) {
  return typeof value === 'string' ? value.trim() : '';
}

function sanitizeEmail(value?: string) {
  return sanitize(value).toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildWaitlistConfirmationEmail({
  recipientName,
  propertyName,
  propertyLocation,
  roomType,
  roomRate,
  moveInTimeline,
  phone,
  email,
  source,
  submittedAt,
}: {
  recipientName: string;
  propertyName: string;
  propertyLocation: string;
  roomType: string;
  roomRate: string;
  moveInTimeline: string;
  phone: string;
  email: string;
  source: string;
  submittedAt: string;
}) {
  const brand = {
    green: '#193C35',
    pink: '#EDD3E3',
    grey: '#585858',
    cloud: '#E3E5E6',
    white: '#FFFFFF',
    softGreen: '#F4F8F6',
  };
  const title = propertyName
    ? 'Your booking request has been noted'
    : 'You are on the Hubode waitlist';
  const subject = propertyName
    ? `Booking request received for ${propertyName}`
    : 'Your Hubode waitlist request has been received';
  const sourceLabel = source
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const summaryRows = [
    propertyName ? ['Property', propertyName] : null,
    propertyLocation ? ['Location', propertyLocation] : null,
    roomType ? ['Room type', roomType] : null,
    roomRate ? ['Indicative monthly rent', roomRate] : null,
    ['Move-in timeline', moveInTimeline],
    ['Phone', phone],
    ['Email', email],
    ['Requested on', submittedAt],
    ['Submission type', sourceLabel],
  ].filter(Boolean) as Array<[string, string]>;

  const summaryHtml = summaryRows
    .map(
      ([label, value]) => `
        <tr>
          <td class="summary-label" style="padding: 12px 0; border-bottom: 1px solid ${brand.cloud}; color: ${brand.grey}; font-size: 14px; width: 42%;">
            ${escapeHtml(label)}
          </td>
          <td class="summary-value" style="padding: 12px 0; border-bottom: 1px solid ${brand.cloud}; color: #111111; font-size: 14px; font-weight: 600;">
            ${escapeHtml(value)}
          </td>
        </tr>
      `
    )
    .join('');

  const introCopy = propertyName
    ? `We've received your booking request for ${propertyName}${roomType ? `, ${roomType}` : ''}.`
    : 'We have received your Hubode waitlist request.';

  const nextStepsCopy = propertyName
    ? 'Our team will review the request and contact you shortly with the next steps for availability, pricing confirmation, and move-in process.'
    : 'Our team will contact you shortly with updates, launch details, and the next steps.';

  return {
    subject,
    html: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light only" />
          <title>${escapeHtml(subject)}</title>
          <style>
            :root {
              color-scheme: light only;
              supported-color-schemes: light;
            }
            body, table, td, div, p, a, h1 {
              font-family: Arial, sans-serif !important;
            }
            @media (prefers-color-scheme: dark) {
              body, .email-shell {
                background: ${brand.cloud} !important;
                color: #111111 !important;
              }
              .email-card {
                background: ${brand.white} !important;
              }
              .brand-wordmark {
                color: ${brand.green} !important;
              }
              .brand-caption,
              .body-copy,
              .footer-copy,
              .summary-label {
                color: ${brand.grey} !important;
              }
              .summary-card,
              .next-steps-card {
                background: ${brand.softGreen} !important;
                border-color: ${brand.cloud} !important;
              }
              .summary-value,
              .heading-copy {
                color: #111111 !important;
              }
              .eyebrow-chip {
                background: ${brand.pink} !important;
                color: ${brand.green} !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background: ${brand.cloud}; font-family: Arial, sans-serif; color: #111111;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-shell" style="background: ${brand.cloud}; padding: 28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" style="max-width: 680px; background: ${brand.white}; border-radius: 24px; overflow: hidden;">
                  <tr>
                    <td style="background: ${brand.white}; padding: 28px 32px 20px; border-bottom: 1px solid ${brand.cloud};">
                      <div class="brand-wordmark" style="font-size: 38px; line-height: 1; font-weight: 800; letter-spacing: -1.6px; color: ${brand.green};">
                        hubode
                      </div>
                      <div class="brand-caption" style="margin-top: 8px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: ${brand.grey};">
                        Community-first living
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 32px;">
                      <div class="eyebrow-chip" style="display: inline-block; padding: 8px 12px; border-radius: 999px; background: ${brand.pink}; color: ${brand.green}; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
                        Booking Confirmation
                      </div>
                      <h1 class="heading-copy" style="margin: 20px 0 12px; font-size: 30px; line-height: 1.15; color: ${brand.green};">
                        ${escapeHtml(title)}
                      </h1>
                      <p class="heading-copy" style="margin: 0 0 12px; font-size: 16px; line-height: 1.7; color: #111111;">
                        Hi ${escapeHtml(recipientName)},
                      </p>
                      <p class="body-copy" style="margin: 0 0 12px; font-size: 16px; line-height: 1.7; color: ${brand.grey};">
                        ${escapeHtml(introCopy)} Your submission has been noted successfully.
                      </p>
                      <p class="body-copy" style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: ${brand.grey};">
                        ${escapeHtml(nextStepsCopy)}
                      </p>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="summary-card" style="border: 1px solid ${brand.cloud}; border-radius: 18px; padding: 0 20px; background: ${brand.white};">
                        <tr>
                          <td style="padding: 20px 20px 8px; font-size: 18px; font-weight: 700; color: ${brand.green};">
                            Request summary
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 0 20px 20px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              ${summaryHtml}
                            </table>
                          </td>
                        </tr>
                      </table>

                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="next-steps-card" style="margin-top: 24px; background: ${brand.softGreen}; border: 1px solid ${brand.cloud}; border-radius: 18px;">
                        <tr>
                          <td style="padding: 22px 24px;">
                            <p class="heading-copy" style="margin: 0 0 8px; color: ${brand.green}; font-size: 16px; font-weight: 700;">What happens next</p>
                            <p class="body-copy" style="margin: 0; color: ${brand.grey}; font-size: 14px; line-height: 1.7;">
                              Our team will get in touch shortly for the further process. If you need to update anything in this request, reply to this email and we’ll take it forward.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 32px 32px;">
                      <p class="footer-copy" style="margin: 0; font-size: 13px; line-height: 1.7; color: ${brand.grey};">
                        Hubode Living<br />
                        Community-first co-living spaces built for belonging.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
}

export async function POST(request: Request) {
  try {
    const body: WaitlistRequestBody = await request.json();
    const name = sanitize(body.name);
    const email = sanitizeEmail(body.email);
    const phone = sanitize(body.phone);
    const occupation = sanitize(body.occupation);
    const comingFrom = sanitize(body.comingFrom);
    const moveInTimeline = sanitize(body.moveInTimeline);
    const source = sanitize(body.source) || 'waitlist-popup';
    const propertyName = sanitize(body.propertyName);
    const propertyLocation = sanitize(body.propertyLocation);
    const roomType = sanitize(body.roomType);
    const roomRate = sanitize(body.roomRate);

    if (!name || !email || !phone || !occupation || !comingFrom || !moveInTimeline) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.GOOGLE_WAITLIST_WEBHOOK;
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      name,
      email,
      phone,
      occupation,
      comingFrom,
      moveInTimeline,
      source,
      propertyName,
      propertyLocation,
      roomType,
      roomRate,
    };

    if (webhookUrl) {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Webhook error: ${response.status} ${errorText}`);
      }
    } else {
      await appendWaitlistEntry({
        name,
        email,
        phone,
        occupation,
        comingFrom,
        moveInTimeline,
        source,
        propertyName,
        propertyLocation,
        roomType,
        roomRate,
      });
    }

    let emailSent = true;
    let warning: string | undefined;

    try {
      const submittedAt = new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(timestamp));
      const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL || process.env.BREVO_SENDER_EMAIL;
      const emailTemplate = buildWaitlistConfirmationEmail({
        recipientName: name,
        propertyName,
        propertyLocation,
        roomType,
        roomRate,
        moveInTimeline,
        phone,
        email,
        source,
        submittedAt,
      });

      await sendBrevoEmail({
        to: [{ email, name }],
        replyTo: replyToEmail
          ? {
              email: replyToEmail,
              name: process.env.BREVO_REPLY_TO_NAME || process.env.BREVO_SENDER_NAME || 'Hubode Living',
            }
          : undefined,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.html,
      });
    } catch (emailError) {
      emailSent = false;
      const debugError = emailError instanceof Error ? emailError.message : String(emailError);
      warning = `Your request was saved, but the confirmation email could not be sent right now.`;
      console.error('[api/waitlist] Confirmation email failed:', debugError);
      return NextResponse.json({ success: true, emailSent, warning, debugError });
    }

    return NextResponse.json({ success: true, emailSent, warning });
  } catch (error) {
    console.error('[api/waitlist] Failed to append row:', error);
    return NextResponse.json(
      { error: 'Unable to save your submission right now. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
