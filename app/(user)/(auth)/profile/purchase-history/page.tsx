"use client";

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import Image from 'next/image'; // For optimized images
import { useAuth } from '@/context/AuthContext'; // Added for user authentication
import { databases, Query, AppwriteException } from '@/lib/appwrite'; // Added for Appwrite
import { client as sanityClient } from '@/lib/sanity.client'; // Added for Sanity
import groq from 'groq'; // Added for Sanity GROQ queries
import type { Models } from 'appwrite'; // Added for Appwrite types
import './style.scss';

// --- INTERFACES (for typing dynamic data from sources) ---
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

// THIS IS THE EXACT STRUCTURE OF YOUR STATIC purchaseItems objects
interface PurchaseItem {
  id: string;
  imageUrl: string;
  location: string;
  propertyName: string;
  roomType: string;
  purchaseDate: string;
  depositAmount: string;
  status: string;
}

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_RESERVATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESERVATIONS_COLLECTION_ID!;

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

const PurchaseHistoryPage = () => {
  const { currentUser, isLoading: authIsLoading } = useAuth();
  
  // This 'purchaseItems' state will be used by your existing .map() in the return statement.
  // It's initialized as empty, then populated by useEffect.
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]); 
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch data if auth is resolved and a user is present
    if (authIsLoading) return;

    if (!currentUser) {
      setError("You must be logged in to view purchase history.");
      setIsLoadingPage(false);
      setPurchaseItems([]); // Ensure purchaseItems is empty if no user
      return;
    }

    const fetchAndSetPurchaseItems = async () => {
      setIsLoadingPage(true);
      setError(null);
      try {
        if (!APPWRITE_DATABASE_ID || !APPWRITE_RESERVATIONS_COLLECTION_ID) {
          throw new Error("Appwrite configuration for reservations is missing.");
        }
        const reservationResponse = await databases.listDocuments<ReservationDocument>(
          APPWRITE_DATABASE_ID,
          APPWRITE_RESERVATIONS_COLLECTION_ID,
          [
            Query.equal('userId', currentUser.$id),
            Query.orderDesc('reservationTimestamp'),
          ]
        );
        const reservations = reservationResponse.documents;

        if (reservations.length === 0) {
          setPurchaseItems([]);
          setIsLoadingPage(false);
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

          // Data is transformed here to EXACTLY match your static PurchaseItem structure
          return {
            id: res.$id,
            imageUrl: sanityProp?.imageUrl || '/images/placeholder-room.jpg',
            location: sanityProp?.location || 'Location not available',
            propertyName: res.propertyName,
            roomType: `${res.occupancyName} ${res.selectedTierName}`,
            purchaseDate: formatDate(res.reservationTimestamp),
            depositAmount: res.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            status: itemStatus,
          };
        });
        
        setPurchaseItems(dynamicPurchaseItems); // This updates the array your .map() uses

      } catch (e: any) {
        console.error("Failed to fetch purchase history:", e);
        setError(e instanceof AppwriteException ? `Appwrite Error: ${e.message}` : e.message || "Could not load purchase history.");
        setPurchaseItems([]); // Clear items on error
      } finally {
        setIsLoadingPage(false);
      }
    };
    fetchAndSetPurchaseItems();
  }, [currentUser, authIsLoading]); // Dependencies for useEffect

  // Conditional rendering for loading and error states,
  // using your exact outer div structure from the static example.
  if (isLoadingPage || authIsLoading) {
    return (
      <div className="purchase-history-main-conatiner margin-top">
        <div className="purchase-history-container container">
          <div className="title-continer">
            <h1>Purchase History</h1>
          </div>
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading purchase history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase-history-main-conatiner margin-top">
        <div className="purchase-history-container container">
          <div className="title-continer">
            <h1>Purchase History</h1>
          </div>
          <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>Error: {error}</p>
        </div>
      </div>
    );
  }
  
  // THE RETURN STATEMENT BELOW IS 100% IDENTICAL TO YOUR STATIC EXAMPLE.
  // The only difference is that 'purchaseItems' inside it now refers to the state variable.
  return (
    <div className="purchase-history-main-conatiner margin-top">
      <div className="purchase-history-container container">
        <div className="title-continer">
          <h1>Purchase History</h1>
        </div>

        {purchaseItems.length > 0 ? (
          purchaseItems.map((item) => (
            <div className="card-item-container" key={item.id}>
              <div className="card-item">
                <div className="left-section image-section">
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
                <div className="right-section info-section">
                  <div className="content-section">
                    <div className="location-container">
                      <Image
                        src="/images/location-green.svg"
                        alt="Location icon"
                        width={16}
                        height={16}
                      />
                      <p>{item.location}</p>
                    </div>
                    <h2>{item.propertyName}</h2>
                    <p className="roomtype">Room Type : {item.roomType}</p>
                    <p className="purchase-date">Purchase Date : {item.purchaseDate}</p>
                  </div>
                  <div className="price-info-section">
                    <span>Advance Deposit ₹{item.depositAmount}</span>
                    <div className={`status-container status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="no-history-message">
            <p>You have no purchase history yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistoryPage;