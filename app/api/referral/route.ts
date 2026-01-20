// File: app/api/referral/route.ts

import { NextResponse } from 'next/server';
// Ensure you import the client configured with the WRITE token
import { writeClient } from '@/lib/sanity.client';

// Define the expected shape of the incoming request body
interface ReferralRequestBody {
    yourName?: string;
    yourEmail?: string;
    yourPhone?: string;
    friendName?: string;
    friendEmail?: string;
    friendPhone?: string;
    friendGender?: string;
    interestedLocation?: string;
    termsAgree?: boolean; // Expecting a boolean
}

export async function POST(request: Request) {
    console.log('--- [/api/referral] POST request received ---');

     // --- Optional: Log Environment Variables Being Used ---
    const serverToken = process.env.SANITY_API_WRITE_TOKEN;
    console.log('[API Route] Checking SANITY_API_WRITE_TOKEN:',
        serverToken ? `Token FOUND starting with "${serverToken.substring(0, 5)}..."` : 'Token NOT FOUND or empty!');
    console.log('[API Route] Using Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
    console.log('[API Route] Using Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);
    // --- End Logging ---

    try {
        const body: ReferralRequestBody = await request.json();
        console.log('[API Route] Received referral body:', body);

        const {
            yourName,
            yourEmail,
            yourPhone,
            friendName,
            friendEmail,
            friendPhone,
            friendGender,
            interestedLocation,
            termsAgree
        } = body;

        // --- Server-Side Validation ---
        // Check required fields
        if (!yourName || !yourEmail || !friendName || !friendEmail || !friendPhone || !friendGender || !interestedLocation) {
             console.log('[API Route] Validation failed: Missing required text/select fields.');
            return NextResponse.json(
                { error: 'Missing required fields. Please fill out all * fields.' },
                { status: 400 } // Bad Request
            );
        }
        // Check if terms were agreed to (must be true)
        if (termsAgree !== true) {
             console.log('[API Route] Validation failed: Terms not agreed.');
            return NextResponse.json(
                { error: 'You must agree to the terms and conditions.' },
                { status: 400 } // Bad Request
            );
        }
        // Optional: Add more robust validation (e.g., regex for email/phone)
        // --- End Validation ---


        // Construct the document to send to Sanity (matching schema field names)
        const submission = {
            _type: 'referralSubmission', // Matches your schema name EXACTLY
            yourName: yourName.trim(),
            yourEmail: yourEmail.trim(),
            yourPhone: yourPhone?.trim() || '', // Handle potentially empty optional field
            friendName: friendName.trim(),
            friendEmail: friendEmail.trim(),
            friendPhone: friendPhone.trim(),
            friendGender: friendGender,         // Already validated
            interestedLocation: interestedLocation, // Already validated
            termsAgree: termsAgree,             // Must be true
            // submissionDate will be set automatically by initialValue in schema
        };
        console.log('[API Route] Attempting to create referral document:', submission);

        // Use the writeClient (configured with the secure token) to create the document
        const createdDocument = await writeClient.create(submission);
        console.log('[API Route] Sanity referral create successful:', createdDocument);

        // Return a success response
        return NextResponse.json(
            { success: true, message: 'Referral submitted successfully!', data: createdDocument },
            { status: 201 } // Created
        );

    } catch (error: any) {
        // --- Log the DETAILED error ---
        console.error('--- [API Route] ERROR Creating Referral Document ---');
        console.error('Error message:', error.message);
        if (error.response && error.response.body) {
            console.error('Sanity response body:', error.response.body);
        } else {
             console.error('Full error object:', error);
        }
        console.error('--- END ERROR DETAILS ---');
        // --- End Error Logging ---


        let errorMessage = 'An unexpected server error occurred while submitting the referral.';
        let statusCode = 500;

        if (error instanceof Error) {
             errorMessage = `Failed to submit referral: ${error.message}`;
        }
        // Check if it's a Sanity client error specifically if needed
        if (error && typeof error === 'object' && 'statusCode' in error) {
           statusCode = (error as { statusCode: number }).statusCode || 500;
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: statusCode }
        );
    }
}

// Optional: Add a simple GET handler
export async function GET() {
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}