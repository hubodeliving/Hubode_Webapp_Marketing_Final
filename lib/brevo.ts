const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface BrevoRecipient {
  email: string;
  name?: string;
}

interface BrevoEmailPayload {
  to: BrevoRecipient[];
  subject: string;
  htmlContent: string;
  replyTo?: BrevoRecipient;
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendBrevoEmail(payload: BrevoEmailPayload) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Hubode Living';
  const apiKey = process.env.BREVO_API_KEY;

  if (!senderEmail || !apiKey) {
    throw new Error('Missing Brevo configuration.');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: payload.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      htmlContent: payload.htmlContent,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Brevo send failed: ${response.status} ${errorText}`);
  }

  return response.json().catch(() => null);
}
