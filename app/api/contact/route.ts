// File: app/api/contact/route.ts

import { NextResponse } from 'next/server';
// 👇 CORRECTED IMPORT: Import 'writeClient' specifically
import { writeClient } from '@/lib/sanity.client';

// Define the expected shape of the incoming request body
interface ContactRequestBody {
    name?: string;
    phone?: string;
    email?: string;
    message?: string;
}

export async function POST(request: Request) {
    // --- Add previous console logs for debugging token/env vars ---
    console.log('--- [/api/contact] POST request received ---');
    const serverToken = process.env.SANITY_API_WRITE_TOKEN;
    console.log('[API Route] Checking SANITY_API_WRITE_TOKEN:',
        serverToken ? `Token FOUND starting with "${serverToken.substring(0, 5)}..."` : 'Token NOT FOUND or empty!');
    console.log('[API Route] Using Project ID:', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);
    console.log('[API Route] Using Dataset:', process.env.NEXT_PUBLIC_SANITY_DATASET);
    // --- End Logging ---

    try {
        const body: ContactRequestBody = await request.json();
        console.log('[API Route] Received body:', body);

        const { name, phone, email, message } = body;

        // Basic Server-Side Validation
        if (!name || !email || !message || !phone) {
            console.log('[API Route] Validation failed: Missing fields.');
            return NextResponse.json(
                { error: 'Missing required fields.' },
                { status: 400 } // Bad Request
            );
        }

        // Construct the document to send to Sanity
        const submission = {
            _type: 'contactFormSubmission', // Ensure this matches your schema name EXACTLY
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            message: message.trim(),
        };
        console.log('[API Route] Attempting to create document:', submission);

        // Use the correctly imported 'writeClient'
        const createdDocument = await writeClient.create(submission);
        console.log('[API Route] Sanity create successful:', createdDocument);

        // Return a success response
        return NextResponse.json(
            { success: true, message: 'Form submitted successfully!', data: createdDocument },
            { status: 201 } // Created
        );

    } catch (error: any) { // Using 'any' for broader catch, refine if needed
        // --- Log the DETAILED error from Sanity ---
        console.error('--- [API Route] ERROR Creating Sanity Document ---');
        console.error('Error message:', error.message);
        if (error.response && error.response.body) {
            console.error('Sanity response body:', error.response.body);
        } else if (error instanceof ReferenceError) {
            console.error("This ReferenceError usually means 'writeClient' wasn't defined or imported correctly.");
            console.error("Full error:", error);
        }
         else {
             console.error('Full error object:', error);
        }
        console.error('--- END ERROR DETAILS ---');
        // --- End Error Logging ---


        let errorMessage = 'An unexpected error occurred.';
        let statusCode = 500;

        if (error instanceof Error) {
             errorMessage = `Failed to submit form: ${error.message}`; // Keep original error message
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

// Optional: Add a simple GET handler for testing or preventing errors
export async function GET() {
    return NextResponse.json({ message: 'Method Not Allowed' }, { status: 405 });
}
