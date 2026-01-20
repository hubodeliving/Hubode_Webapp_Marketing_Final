"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation'; // useRouter for back button
import { databases, Query, AppwriteException } from '@/lib/appwrite';
import { client as sanityClient } from '@/lib/sanity.client';
import groq from 'groq';
import type { Models } from 'appwrite';
import './style.scss'; // We'll create this SCSS file next

// --- INTERFACES (Same as user-facing purchase history) ---
interface ReservationDocument extends Models.Document {
  userId: string;
  propertyId: string;
  propertyName: string;
  selectedTierKey: string;
  selectedTierName: string;
  occupancyName: string;
  amountPaid: number;
  currency: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  status: string;
  reservationTimestamp: string;
}

interface SanityPropertyLite {
  _id: string;
  imageUrl?: string;
  location?: string;
}

interface PurchaseItem {
  id: string;
  imageUrl: string;
  location: string;
  propertyName: string;
  roomType: string;
  purchaseDate: string;
  depositAmount: string;
  status: string;
  // Added for admin view if needed, or can be removed
  currencySymbol?: string; 
}

// --- Appwrite Constants ---
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_RESERVATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESERVATIONS_COLLECTION_ID!;
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!; // To fetch user name for title

// --- Helper Function ---
const formatDate = (isoString: string): string => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Invalid Date';
  }
};

// --- Main Component ---
const AdminUserPurchaseHistoryPage = () => {
  const params = useParams();
  const router = useRouter(); // For back button
  const targetUserId = params.userId as string; // Get the userId from the URL parameters

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [userName, setUserName] = useState<string | null>(null); // To display "Purchase History for [User Name]"
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetUserId) {
      setError("User ID not found in URL.");
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!APPWRITE_DATABASE_ID || !APPWRITE_RESERVATIONS_COLLECTION_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
          throw new Error("Appwrite configuration for reservations or profiles is missing.");
        }

        // 1. Fetch User's Name (Optional, for a better title)
        try {
            const profileResponse = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [Query.equal('userId', targetUserId), Query.limit(1)]
            );
            if (profileResponse.documents.length > 0) {
                setUserName(profileResponse.documents[0].name);
            } else {
                setUserName(`User (${targetUserId.slice(0,6)}...)`); // Fallback name
            }
        } catch (profileError) {
            console.error("Could not fetch user's name:", profileError);
            setUserName(`User (${targetUserId.slice(0,6)}...)`); // Fallback on error
        }


        // 2. Fetch reservations for the targetUserId
        const reservationResponse = await databases.listDocuments<ReservationDocument>(
          APPWRITE_DATABASE_ID,
          APPWRITE_RESERVATIONS_COLLECTION_ID,
          [
            Query.equal('userId', targetUserId), // Use targetUserId from URL
            Query.orderDesc('reservationTimestamp'),
          ]
        );
        const reservations = reservationResponse.documents;

        if (reservations.length === 0) {
          setPurchaseItems([]);
          setIsLoading(false);
          return;
        }

        const propertyIds = [...new Set(reservations.map(r => r.propertyId).filter(id => id))];
        let sanityPropertiesMap = new Map<string, SanityPropertyLite>();

        if (propertyIds.length > 0) {
          const sanityQuery = groq`
            *[_type == "property" && _id in $propertyIds] {
              _id,
              "imageUrl": featuredImage.asset->url,
              "location": propertyLocationText 
            }
          `;
          const sanityData = await sanityClient.fetch<SanityPropertyLite[]>(sanityQuery, { propertyIds });
          sanityData.forEach(prop => sanityPropertiesMap.set(prop._id, prop));
        }

        const dynamicPurchaseItems: PurchaseItem[] = reservations.map(res => {
          const sanityProp = sanityPropertiesMap.get(res.propertyId);
          const itemStatus = res.status && res.status.trim() !== '' ? res.status : 'Paid';
          return {
            id: res.$id,
            imageUrl: sanityProp?.imageUrl || '/images/placeholder-room.jpg',
            location: sanityProp?.location || 'Location not available',
            propertyName: res.propertyName,
            roomType: `${res.occupancyName} ${res.selectedTierName}`,
            purchaseDate: formatDate(res.reservationTimestamp),
            depositAmount: res.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            status: itemStatus,
            currencySymbol: res.currency === 'INR' ? '₹' : (res.currency || ''),
          };
        });
        
        setPurchaseItems(dynamicPurchaseItems);

      } catch (e: any) {
        console.error("Failed to fetch purchase history for admin view:", e);
        setError(e instanceof AppwriteException ? `Appwrite Error: ${e.message}` : e.message || "Could not load purchase history.");
        setPurchaseItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [targetUserId]);

  if (isLoading) {
    return (
      <div className="admin-user-purchase-history-page"> {/* Use admin specific class if needed for layout */}
        <div className="page-content-area"> {/* Wrapper for consistent admin layout */}
          <div className="title-continer"><h1>{userName ? `Purchase History for ${userName}` : "Loading Purchase History..."}</h1></div>
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-user-purchase-history-page">
         <div className="page-content-area">
          <div className="title-continer"><h1>Purchase History Error</h1></div>
          <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Error: {error}</p>
          <button onClick={() => router.back()} className="back-button">Go Back</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-user-purchase-history-page"> {/* Main wrapper, can be styled like other admin pages */}
      <div className="page-content-area"> {/* Consistent content area styling */}
        <div className="title-header-bar"> {/* For title and back button */}
            <h1 className="page-main-title">{userName ? `Purchase History for ${userName}` : "Purchase History"}</h1>
            <button onClick={() => router.back()} className="back-button">
                {/* Optional: Add a back arrow icon */}
                ← Back to User Details
            </button>
        </div>

        {/* Reusing the card structure from user-facing purchase history */}
        {purchaseItems.length > 0 ? (
          purchaseItems.map((item) => (
            <div className="card-item-container" key={item.id}> {/* Same class as user-facing */}
              <div className="card-item"> {/* Same class as user-facing */}
                <div className="left-section image-section"> {/* Same class as user-facing */}
                  <Image
                    src={item.imageUrl}
                    alt={`${item.propertyName} room image`}
                    width={300}
                    height={200}
                    layout="responsive"
                    objectFit="cover"
                    className="item-image-el"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-room.jpg'; }}
                  />
                </div>
                <div className="right-section info-section"> {/* Same class as user-facing */}
                  <div className="content-section"> {/* Same class as user-facing */}
                    <div className="location-container"> {/* Same class as user-facing */}
                      <Image src="/images/location-green.svg" alt="Location icon" width={16} height={16} />
                      <p>{item.location}</p>
                    </div>
                    <h2>{item.propertyName}</h2> {/* Same class as user-facing */}
                    <p className="roomtype">Room Type : {item.roomType}</p> {/* Same class as user-facing */}
                    <p className="purchase-date">Purchase Date : {item.purchaseDate}</p> {/* Same class as user-facing */}
                  </div>
                  <div className="price-info-section"> {/* Same class as user-facing */}
                    <span>Advance Deposit {item.currencySymbol}{item.depositAmount}</span>
                    <div className={`status-container status-${item.status.toLowerCase()}`}> {/* Same class as user-facing */}
                      {item.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-history-message"> {/* Same class as user-facing */}
            <p>{userName ? `${userName} has no purchase history.` : "No purchase history found for this user."}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserPurchaseHistoryPage;