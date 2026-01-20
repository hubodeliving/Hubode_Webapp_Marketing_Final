// File: app/api/admin/rent-payment/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { serverDatabases } from '@/lib/appwrite.server';
import { AppwriteException } from 'appwrite'; // No need for ID here

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;

interface UpdateRentPaymentPayload {
  tenancyId: string;
  paymentYear: number;
  paidMonths: string[]; // Array of month names, e.g., ["January", "February"]
}

export async function POST(req: NextRequest) {
  console.log("[API UpdateRentPayment] Received request.");
  try {
    if (!APPWRITE_DATABASE_ID || !APPWRITE_TENANCIES_COLLECTION_ID) {
      throw new Error("Critical: Server config error (Appwrite DB/Tenancies Collection ID).");
    }

    const payload = (await req.json()) as UpdateRentPaymentPayload;
    console.log("[API UpdateRentPayment] Parsed payload:", payload);

    if (!payload.tenancyId || typeof payload.paymentYear !== 'number' || !Array.isArray(payload.paidMonths)) {
      return NextResponse.json({ error: 'Missing or invalid data: tenancyId, paymentYear, or paidMonths.' }, { status: 400 });
    }

    // Data to update in the Tenancy document
    // Ensure your "Tenancies" collection has attributes 'paidMonths' (String Array) and 'paymentYear' (Integer/Number)
    const dataToUpdate = {
      paidMonths: payload.paidMonths,
      paymentYear: payload.paymentYear,
      // lastPaymentUpdateTimestamp: new Date().toISOString(), // Optional: for auditing
    };

    console.log(`[API UpdateRentPayment] Updating Tenancy Doc ID: ${payload.tenancyId} with data:`, dataToUpdate);
    
    const updatedDocument = await serverDatabases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_TENANCIES_COLLECTION_ID,
      payload.tenancyId, // This is the $id of the tenancy document
      dataToUpdate
    );

    console.log("[API UpdateRentPayment] Tenancy document updated successfully:", updatedDocument.$id);
    return NextResponse.json({ success: true, message: 'Rent payment status updated successfully.', data: updatedDocument }, { status: 200 });

  } catch (error: any) {
    console.error('[API UpdateRentPayment] Error:', error);
    let errorMessage = 'Internal server error while updating rent payment status.';
    let statusCode = 500;

    if (error instanceof AppwriteException) {
        errorMessage = `Appwrite Error: ${error.message} (Code: ${error.code}, Type: ${error.type})`;
        if (error.code === 404) statusCode = 404;
        else if (error.code === 400) statusCode = 400;
        if (error.type) console.error(`[API UpdateRentPayment] Appwrite Error Type: ${error.type}`);
    } else if (error.message.startsWith("Critical:")) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ error: 'Failed to update rent payment status.', details: errorMessage }, { status: statusCode });
  }
}