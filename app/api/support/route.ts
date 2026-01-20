// File: app/api/support/route.ts

import { NextResponse } from 'next/server'
import { writeClient } from '@/lib/sanity.client'
import { serverDatabases, ServerQuery } from '@/lib/appwrite.server'

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!

interface SupportIssuePayload {
  roomNumber?: string
  issue?: string
  userId?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SupportIssuePayload
    const roomNumber = (body.roomNumber || '').trim()
    const issue = (body.issue || '').trim()
    const userId = (body.userId || '').trim()

    if (!roomNumber || !issue || !userId) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // Basic config guard
    if (!APPWRITE_DATABASE_ID || !APPWRITE_PROFILES_COLLECTION_ID || !APPWRITE_TENANCIES_COLLECTION_ID) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
    }

    // 1) Fetch profile to verify tenant status and get reporter info
    const profileResp = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_PROFILES_COLLECTION_ID,
      [ServerQuery.equal('userId', userId), ServerQuery.limit(1)]
    )

    if (!profileResp.total) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    const profile = profileResp.documents[0] as any
    const isBoarded = profile.isBoarded === true
    if (!isBoarded) {
      return NextResponse.json({ error: 'Only active tenants can report issues.' }, { status: 403 })
    }

    const reporterName: string = profile.name || ''
    const reporterEmail: string = profile.email || ''

    // 2) Fetch active tenancy to get property linkage
    const tenancyResp = await serverDatabases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_TENANCIES_COLLECTION_ID,
      [ServerQuery.equal('userId', userId), ServerQuery.equal('status', 'Active'), ServerQuery.limit(1)]
    )

    const tenancy = tenancyResp.total ? (tenancyResp.documents[0] as any) : null
    const sanityPropertyId: string | undefined = tenancy?.sanityPropertyId
    const sanityPropertyName: string | undefined = tenancy?.sanityPropertyName || profile.stayingPropertyName
    const occupancyName: string | undefined = tenancy?.occupancyName || profile.stayingRoomType
    const roomTier: string | undefined = tenancy?.tierName || profile.stayingRoomTier

    // 3) Build the Sanity document
    const doc: Record<string, any> = {
      _type: 'reportedIssue',
      roomNumber,
      issueDescription: issue,
      reportedByName: reporterName,
      reportedByEmail: reporterEmail,
      reportedByUserId: userId,
      propertyName: sanityPropertyName || undefined,
      occupancyName: occupancyName || undefined,
      roomTier: roomTier || undefined,
      reportedAt: new Date().toISOString(),
    }

    if (sanityPropertyId) {
      doc.property = { _type: 'reference', _ref: sanityPropertyId }
    }

    const created = await writeClient.create(doc)
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (error: any) {
    console.error('[API /support] Error:', error?.message || error)
    if (error?.response?.body) console.error('[API /support] Sanity body:', error.response.body)
    return NextResponse.json({ error: 'Failed to submit issue.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 })
}

