import { NextResponse } from 'next/server';
import { writeClient } from '@/lib/sanity.client';

export const runtime = 'nodejs';

const MAX_CV_SIZE_BYTES = 2 * 1024 * 1024;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_RECIPIENT = 'fenarkhan7@gmail.com';

const sendApplicationEmail = async ({
  toEmail,
  applicantName,
  applicantEmail,
  applicantPhone,
  jobTitle,
  jobSlug,
  submissionDate,
  attachmentName,
  attachmentBase64,
}: {
  toEmail: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  jobTitle: string;
  jobSlug?: string;
  submissionDate: string;
  attachmentName: string;
  attachmentBase64: string;
}) => {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Hubode Careers';
  const apiKey = process.env.BREVO_API_KEY;

  if (!senderEmail || !apiKey) {
    throw new Error('Missing Brevo configuration.');
  }

  const emailPayload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: toEmail }],
    subject: `Career Application: ${jobTitle}`,
    htmlContent: `
      <h2>New Career Application</h2>
      <p><strong>Job Title:</strong> ${jobTitle}</p>
      ${jobSlug ? `<p><strong>Job Slug:</strong> ${jobSlug}</p>` : ''}
      <p><strong>Applicant:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> ${applicantEmail}</p>
      <p><strong>Phone:</strong> ${applicantPhone}</p>
      <p><strong>Submitted At:</strong> ${new Date(submissionDate).toLocaleString()}</p>
    `,
    attachment: [
      {
        name: attachmentName,
        content: attachmentBase64,
      },
    ],
  };

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Brevo send failed: ${response.status} ${errorText}`);
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const firstName = formData.get('firstName')?.toString().trim();
    const lastName = formData.get('lastName')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const phone = formData.get('phone')?.toString().trim();
    const jobTitle = formData.get('jobTitle')?.toString().trim();
    const jobSlug = formData.get('jobSlug')?.toString().trim();
    const cvFile = formData.get('cv');

    if (!firstName || !lastName || !email || !phone || !jobTitle) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!(cvFile instanceof File) || cvFile.size === 0) {
      return NextResponse.json({ error: 'CV file is required.' }, { status: 400 });
    }

    if (cvFile.size > MAX_CV_SIZE_BYTES) {
      return NextResponse.json({ error: 'CV exceeds 2MB limit.' }, { status: 400 });
    }

    const buffer = Buffer.from(await cvFile.arrayBuffer());
    const asset = await writeClient.assets.upload('file', buffer, {
      filename: cvFile.name,
      contentType: cvFile.type,
    });

    const uploadedCv = {
      _type: 'file',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    };

    const submission = {
      _type: 'careerApplication',
      submissionDate: new Date().toISOString(),
      jobTitle,
      jobSlug: jobSlug || undefined,
      firstName,
      lastName,
      email,
      phone,
      cv: uploadedCv,
    };

    const createdDocument = await writeClient.create(submission);

    const recipientEmail = process.env.BREVO_RECIPIENT_EMAIL || DEFAULT_RECIPIENT;
    await sendApplicationEmail({
      toEmail: recipientEmail,
      applicantName: `${firstName} ${lastName}`.trim(),
      applicantEmail: email,
      applicantPhone: phone,
      jobTitle,
      jobSlug: jobSlug || undefined,
      submissionDate: submission.submissionDate,
      attachmentName: cvFile.name,
      attachmentBase64: buffer.toString('base64'),
    });

    return NextResponse.json(
      { success: true, message: 'Application submitted successfully!', data: createdDocument },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[career-applications] error:', error);
    return NextResponse.json(
      { error: 'Unable to submit application right now. Please try again later.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
