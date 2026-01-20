// File: app/api/razorpay/create-order/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { v4 as uuidv4 } from 'uuid'; // For generating unique receipt IDs

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            amount_in_rupees, // Expecting amount in rupees from client for this endpoint
            currency = 'INR',
            receipt_notes // Optional: any notes you want to associate with the receipt/order
        } = body;

        if (!amount_in_rupees || typeof amount_in_rupees !== 'number' || amount_in_rupees <= 0) {
            return NextResponse.json({ error: 'Valid amount in rupees is required.' }, { status: 400 });
        }

        const amount_in_paise = Math.round(amount_in_rupees * 100); // Convert to paise and round

        // Generate a shorter receipt ID (max 40 chars)
        const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const options = {
            amount: amount_in_paise, // Amount in the smallest currency unit (e.g., paise for INR)
            currency: currency.toUpperCase(),
            receipt: receiptId,
            notes: {
                ...(receipt_notes || {}), // Spread any notes passed from client
                system_generated: "true",
                order_type: "reservation_fee"
            },
        };

        const order = await razorpayInstance.orders.create(options);

        if (!order) {
            return NextResponse.json({ error: 'Failed to create Razorpay order.' }, { status: 500 });
        }

        // Return only necessary order details to the client
        return NextResponse.json({
            orderId: order.id,
            amount: order.amount, // This will be in paise
            currency: order.currency,
        }, { status: 200 });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: 'Could not create order.', details: errorMessage }, { status: 500 });
    }
}