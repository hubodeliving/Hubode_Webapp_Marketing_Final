// File: app/(admin)/all-users/[userId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { databases, Query, AppwriteException } from '@/lib/appwrite';
import type { Models } from 'appwrite'; 
import './style.scss';

// ───────────────
// 1. ENVIRONMENT CONSTANTS
// ───────────────
const APPWRITE_DATABASE_ID               = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_PROFILES_COLLECTION_ID    = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID   = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;

// ───────────────
// 2. INTERFACES
// ───────────────

interface UserProfileAppwriteDocument extends Models.Document {
  userId: string;
  name: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  isBoarded?: boolean;

  // Now that you’ve added these to Profiles schema, they exist here:
  stayingPropertyName?: string;
  stayingRoomType?: string;
  stayingRoomTier?: string;
  stayingRent?: number | string; 
}

interface StayingPropertyInfo {
  propertyName: string;
  roomType: string;
  roomTier: string;
  rent: string; 
}

interface UserDetail {
  profileDocId: string;        // $id of the document in “profiles”
  appwriteAuthUserId: string;  // the actual Auth user ID
  name: string;
  phone: string;
  email: string;
  isBoarded: boolean;
  stayingProperty?: StayingPropertyInfo;
}

// ───────────────
// 3. FETCH FUNCTION
// ───────────────
const fetchUserProfileByAuthId = async (
  authUserId: string
): Promise<UserDetail | null> => {
  console.log(`[ManageUserPage] Fetching profile for Auth User ID: ${authUserId}`);

  if (!APPWRITE_DATABASE_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
    console.error("Appwrite DB or Profiles Collection ID not configured.");
    throw new Error("Configuration error for fetching user profile.");
  }

  try {
    const response = await databases.listDocuments<UserProfileAppwriteDocument>(
      APPWRITE_DATABASE_ID,
      APPWRITE_PROFILES_COLLECTION_ID,
      [
        Query.equal('userId', authUserId),
        Query.limit(1),
      ]
    );

    if (response.documents.length > 0) {
      const profileDoc = response.documents[0];
      const userDetail: UserDetail = {
        profileDocId: profileDoc.$id,
        appwriteAuthUserId: profileDoc.userId,
        name: profileDoc.name,
        phone: profileDoc.phone,
        email: profileDoc.email,
        isBoarded: profileDoc.isBoarded || false,
        stayingProperty:
          profileDoc.isBoarded && profileDoc.stayingPropertyName
            ? {
                propertyName: profileDoc.stayingPropertyName,
                roomType: profileDoc.stayingRoomType || 'N/A',
                roomTier: profileDoc.stayingRoomTier || 'N/A',
                rent: String(profileDoc.stayingRent || '0'),
              }
            : undefined,
      };
      return userDetail;
    } else {
      console.warn(`[ManageUserPage] No profile document found for Auth ID: ${authUserId}`);
      return null;
    }
  } catch (error) {
    console.error(`[ManageUserPage] Error fetching profile for Auth ID ${authUserId}:`, error);
    throw error;
  }
};

// ───────────────
// 4. MAIN COMPONENT
// ───────────────
export default function ManageUserPage() {
  const params = useParams();
  const router = useRouter();
  const appwriteAuthUserIdFromUrl = params.userId as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the user’s profile on first render or when `userId` changes:
  useEffect(() => {
    if (appwriteAuthUserIdFromUrl) {
      setIsLoading(true);
      setError(null);

      fetchUserProfileByAuthId(appwriteAuthUserIdFromUrl)
        .then((data) => {
          if (data) {
            setUser(data);
          } else {
            setError(`User profile not found for ID: ${appwriteAuthUserIdFromUrl}`);
            setUser(null);
          }
        })
        .catch((err) => {
          console.error("Error fetching user profile in component:", err);
          setError(
            err instanceof AppwriteException
              ? `Appwrite Error: ${err.message}`
              : 'Failed to load user details.'
          );
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setError("User ID parameter is missing.");
      setIsLoading(false);
    }
  }, [appwriteAuthUserIdFromUrl]);

  // ───────────────
  // 5. OFF-BOARD OR ON-BOARD ACTION (with confirmation)
  // ───────────────
  const handleBoardingAction = async () => {
    if (!user) return;

    if (user.isBoarded) {
      // Prompt for confirmation before off-boarding
      const confirmOffboard = window.confirm(
        "Are you sure you want to off-board this user? This will delete their tenancy record."
      );
      if (!confirmOffboard) {
        return; // User clicked “Cancel”
      }

      // ----- OFF-BOARD FLOW -----
      console.log(`Admin Off-boarding user ${user.appwriteAuthUserId}`);
      setIsLoading(true);
      setError(null);

      try {
        // 1) Find & delete any existing Tenancy document for this userId
        const tenancyList = await databases.listDocuments<{ $id: string; userId: string }>(
          APPWRITE_DATABASE_ID,
          APPWRITE_TENANCIES_COLLECTION_ID,
          [
            Query.equal('userId', user.appwriteAuthUserId),
            Query.limit(1),
          ]
        );

        if (tenancyList.documents.length > 0) {
          const tenancyDocId = tenancyList.documents[0].$id;
          console.log(`[ManageUserPage] Deleting tenancy document ${tenancyDocId}`);
          await databases.deleteDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_TENANCIES_COLLECTION_ID,
            tenancyDocId
          );
        } else {
          console.log(`[ManageUserPage] No tenancy document to delete for user ${user.appwriteAuthUserId}`);
        }

        // 2) Update the “profiles” document: set isBoarded=false and clear staying* fields
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PROFILES_COLLECTION_ID,
          user.profileDocId,
          {
            isBoarded: false,
            stayingPropertyName: null,
            stayingRoomType: null,
            stayingRoomTier: null,
            stayingRent: null,
          }
        );

        // 3) Update local state
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isBoarded: false,
                stayingProperty: undefined,
              }
            : null
        );

        alert("User off-boarded successfully. Tenancy record deleted.");
      } catch (offboardError: any) {
        console.error("Error off-boarding user:", offboardError);
        const msg =
          offboardError instanceof AppwriteException
            ? `Appwrite Error: ${offboardError.message}`
            : "Failed to off-board user.";
        alert(msg);
      } finally {
        setIsLoading(false);
      }
    } else {
      // ----- ON-BOARD FLOW -----
      console.log(`Navigating to On-Board page for Auth ID ${user.appwriteAuthUserId}`);
      router.push(
        `/admin/on-board-user?userId=${user.appwriteAuthUserId}&name=${encodeURIComponent(
          user.name
        )}`
      );
    }
  };

  // ───────────────
  // 6. NAVIGATE TO PURCHASE HISTORY
  // ───────────────
  const handleViewPurchaseHistory = () => {
    if (user) {
      router.push(`/admin/all-users/${user.appwriteAuthUserId}/purchase-history`);
    }
  };

  // ───────────────
  // 7. RENDER LOADING / ERROR STATES
  // ───────────────
  if (isLoading) return <div className="loading-state">Loading user details...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!user) return <div className="error-state">User data not available or not found.</div>;

  // ───────────────
  // 8. RENDER THE ACTUAL UI
  // ───────────────
  const initial = user.name?.charAt(0).toUpperCase() || "";

  return (
    <div className="admin-manage-user-page">
      <h1 className="page-title">Manage User</h1>
      <div className="profile-layout-wrapper">
        <div className="user-header-section">
          <div className="profile-icon">{initial}</div>
          <div className="user-name-display">
            <h5>{user.name}</h5>
          </div>
        </div>

        <div className="action-buttons-row">
          <button
            className="styled-button history-button"
            onClick={handleViewPurchaseHistory}
          >
            <img src="/images/history-icon-profile.svg" alt="History" width={18} height={18} />
            <span>Purchase History</span>
          </button>
        </div>

        {user.isBoarded && user.stayingProperty && (
          <div className="details-section">
            <h2>Staying Property Details</h2>
            <div className="form-group readonly">
              <label>Property</label>
              <input type="text" value={user.stayingProperty.propertyName} readOnly />
            </div>
            <div className="form-group readonly">
              <label>Room Type</label>
              <input type="text" value={user.stayingProperty.roomType} readOnly />
            </div>
            <div className="form-group readonly">
              <label>Room Tier</label>
              <input type="text" value={user.stayingProperty.roomTier} readOnly />
            </div>
            <div className="form-group readonly">
              <label>Rent</label>
              <div className="rent-display-group">
                <span className="currency-symbol bold">₹</span>
                <span className="rent-amount bold large">
                  {parseFloat(user.stayingProperty.rent).toLocaleString('en-IN')}
                </span>
                <span className="rent-suffix">per month</span>
              </div>
            </div>
          </div>
        )}

        <div className="details-section">
          <h2>Personal Details</h2>
          <div className="form-group readonly">
            <label htmlFor="phone">Phone</label>
            <input type="tel" id="phone" value={user.phone || ''} readOnly />
          </div>
          <div className="form-group readonly">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={user.email || ''} readOnly />
          </div>
        </div>

        <div className="admin-actions-row">
          <button
            className={`styled-button type-toggle-button ${
              user.isBoarded ? 'action-offboard' : 'action-onboard'
            }`}
            onClick={handleBoardingAction}
            disabled={isLoading}
          >
            {isLoading && user.isBoarded
              ? 'Processing...'
              : user.isBoarded
              ? 'Off-board User'
              : 'On-board User'}
          </button>
        </div>
      </div>
    </div>
  );
}

//comment
