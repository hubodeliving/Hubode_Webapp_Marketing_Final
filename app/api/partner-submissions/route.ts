import {NextResponse} from 'next/server'
import {writeClient} from '@/lib/sanity.client'

interface PartnerSubmissionBody {
  name?: string
  phone?: string
  email?: string
  partnerType?: string
  message?: string
}

export async function POST(request: Request) {
  try {
    const body: PartnerSubmissionBody = await request.json()
    const {name, phone, email, partnerType, message} = body

    if (!name || !phone || !email || !partnerType || !message) {
      return NextResponse.json({error: 'Missing required fields.'}, {status: 400})
    }

    const submission = {
      _type: 'partnershipSubmission',
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      partnerType: partnerType.trim(),
      message: message.trim(),
    }

    const createdDocument = await writeClient.create(submission)

    return NextResponse.json(
      {success: true, message: 'Partnership form submitted!', data: createdDocument},
      {status: 201}
    )
  } catch (error) {
    console.error('[partner-submissions] error:', error)
    const message =
      error instanceof Error ? `Failed to submit form: ${error.message}` : 'Failed to submit form.'
    return NextResponse.json({error: message}, {status: 500})
  }
}

export async function GET() {
  return NextResponse.json({message: 'Method Not Allowed'}, {status: 405})
}
