// File: app/api/razorpay/verify-payment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { databases, ID } from '@/lib/appwrite'; // Appwrite web SDK for DB
import { Query } from 'appwrite';
import { Client as ServerClient, Users, Messaging, ID as ServerID } from 'node-appwrite';

// Helper function to verify Razorpay signature
const verifyRazorpaySignature = (
    orderId: string,
    paymentId: string,
    razorpaySignature: string,
    secret: string
): boolean => {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');
    return expectedSignature === razorpaySignature;
};

interface ReservationDetails {
    userId: string;
    propertyId: string;
    propertyName: string;
    selectedTierKey: string;
    selectedTierName: string;
    occupancyName: string;
    amountPaid: number; // in INR
    currency: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            reservationDetails,
        }: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
            reservationDetails: ReservationDetails;
        } = body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !reservationDetails) {
            return NextResponse.json({ error: 'Missing payment details or reservation info.' }, { status: 400 });
        }

        const isSignatureValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            process.env.RAZORPAY_KEY_SECRET!
        );

        if (!isSignatureValid) {
            return NextResponse.json({ error: 'Invalid Razorpay signature. Payment verification failed.' }, { status: 400 });
        }

        // --- Check if this reservation (paymentId) has already been processed ---
        // This prevents duplicate entries if the webhook/callback is somehow triggered multiple times.
        const existingReservationByPaymentId = await databases.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_RESERVATIONS_COLLECTION_ID!,
            [Query.equal('razorpayPaymentId', razorpay_payment_id)]
        );

        if (existingReservationByPaymentId.total > 0) {
            console.warn(`Reservation with paymentId ${razorpay_payment_id} already processed.`);
            // You might want to return the existing reservation details or just a success message
            return NextResponse.json({
                success: true,
                message: 'Reservation already processed.',
                reservationId: existingReservationByPaymentId.documents[0].$id,
            }, { status: 200 });
        }
        // --- End duplicate check ---


        // Payment is verified, now save to Appwrite
        const newReservationData = {
            userId: reservationDetails.userId,
            propertyId: reservationDetails.propertyId,
            propertyName: reservationDetails.propertyName,
            selectedTierKey: reservationDetails.selectedTierKey,
            selectedTierName: reservationDetails.selectedTierName,
            occupancyName: reservationDetails.occupancyName,
            amountPaid: reservationDetails.amountPaid, // Storing as INR
            currency: reservationDetails.currency.toUpperCase(),
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            razorpaySignature: razorpay_signature, // Store for audit purposes
            status: 'New', // Or any status you prefer for successful reservation
            reservationTimestamp: new Date().toISOString(),
        };

        const newReservationDocument = await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.NEXT_PUBLIC_APPWRITE_RESERVATIONS_COLLECTION_ID!,
            ID.unique(),
            newReservationData
        );

        // Receipt email is handled by the Appwrite Function 'send-receipt-email' on document create.
        // Intentionally skipping direct email send here to avoid duplication and SDK mismatch issues.

        // Optionally: You might want to trigger other actions here, like:
        // - Updating the 'bedsLeft' count in your Sanity 'property' document (more complex, requires Sanity client with write token)

        return NextResponse.json({
            success: true,
            message: 'Reservation confirmed and saved successfully.',
            reservationId: newReservationDocument.$id,
            data: newReservationDocument
        }, { status: 200 });

    } catch (error) {
        console.error('Error verifying Razorpay payment or saving reservation:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ success: false, error: 'Payment verification or save failed.', details: errorMessage }, { status: 500 });
    }
}
