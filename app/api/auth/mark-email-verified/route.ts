import { NextRequest, NextResponse } from 'next/server';
import { Client, Users, AppwriteException } from 'node-appwrite';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
    const apiKey = process.env.APPWRITE_API_KEY!;
    if (!endpoint || !projectId || !apiKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId)
      .setKey(apiKey);

    const users = new Users(client);
    await users.updateEmailVerification(userId, true);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof AppwriteException) {
      return NextResponse.json({ error: e.message }, { status: e.code || 500 });
    }
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
  }
}

