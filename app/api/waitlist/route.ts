import { NextResponse } from 'next/server';
import { appendWaitlistEntry } from '@/lib/googleSheets';

interface WaitlistRequestBody {
  name?: string;
  phone?: string;
  occupation?: string;
  comingFrom?: string;
  moveInTimeline?: string;
  source?: string;
  propertyName?: string;
  propertyLocation?: string;
  roomType?: string;
}

function sanitize(value?: string) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  try {
    const body: WaitlistRequestBody = await request.json();
    const name = sanitize(body.name);
    const phone = sanitize(body.phone);
    const occupation = sanitize(body.occupation);
    const comingFrom = sanitize(body.comingFrom);
    const moveInTimeline = sanitize(body.moveInTimeline);
    const source = sanitize(body.source) || 'waitlist-popup';
    const propertyName = sanitize(body.propertyName);
    const propertyLocation = sanitize(body.propertyLocation);
    const roomType = sanitize(body.roomType);

    if (!name || !phone || !occupation || !comingFrom || !moveInTimeline) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.GOOGLE_WAITLIST_WEBHOOK;
    const payload = {
      timestamp: new Date().toISOString(),
      name,
      phone,
      occupation,
      comingFrom,
      moveInTimeline,
      source,
      propertyName,
      propertyLocation,
      roomType,
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
        phone,
        occupation,
        comingFrom,
        moveInTimeline,
        source,
        propertyName,
        propertyLocation,
        roomType,
      });
    }

    return NextResponse.json({ success: true });
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
