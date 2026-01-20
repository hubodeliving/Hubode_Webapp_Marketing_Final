// File: app/(user)/(auth)/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { databases, Query } from '@/lib/appwrite';
import "./style.scss";

const page = () => {
  const { currentUser, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isUserBoarded, setIsUserBoarded] = useState(false);
  const [isBoardingStatusLoading, setIsBoardingStatusLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isLoading, currentUser, router]);

  useEffect(() => {
    if (currentUser && !isLoading) {
      const fetchProfileStatus = async () => {
        setIsBoardingStatusLoading(true);
        
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
        const profilesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID;

        // VVVVV ADD DETAILED LOGGING HERE VVVVV
        console.log("Fetching profile status. CurrentUser ID:", currentUser.$id);
        console.log("Using Database ID:", dbId);
        console.log("Using Profiles Collection ID:", profilesCollectionId);
        // ^^^^^ END OF DETAILED LOGGING ^^^^^

        try {
          if (!dbId || !profilesCollectionId) { // Check if the constants are undefined
            throw new Error(`Profile collection configuration is missing. DB_ID: ${dbId}, PROFILES_COLLECTION_ID: ${profilesCollectionId}`);
          }

          const response = await databases.listDocuments(
            dbId,           // Use the constant
            profilesCollectionId, // Use the constant
            [Query.equal('userId', currentUser.$id), Query.limit(1)]
          );
          if (response.documents.length > 0) {
            const profileData = response.documents[0] as any;
            setIsUserBoarded(profileData.isBoarded === true);
          } else {
            console.warn(`No profile document found for userId: ${currentUser.$id}`);
            setIsUserBoarded(false);
          }
        } catch (error) {
          console.error("Error fetching profile boarding status:", error);
          if (error instanceof Error) { // More specific error logging
            setError(error.message);
          } else {
            setError("An unknown error occurred while fetching profile status.");
          }
          setIsUserBoarded(false);
        } finally {
          setIsBoardingStatusLoading(false);
        }
      };
      fetchProfileStatus();
    } else if (!currentUser && !isLoading) {
      setIsUserBoarded(false);
      setIsBoardingStatusLoading(false);
    }
  }, [currentUser, isLoading]);

  if (isLoading || !currentUser || isBoardingStatusLoading) {
    return null;
  }

  const initial = currentUser.name?.charAt(0).toUpperCase() || "";
  const fullName = currentUser.name;
  const email = currentUser.email;
  const phone = currentUser.prefs?.phone || "";
  const needsSetPassword = !currentUser.passwordUpdate;

  const handleLogout = async () => {
    await logout();
  };

    const handleEditProfile = () => {
        router.push("/profile/edit");
    };


    const handlePassword = () => {
    router.push("/forgot-password");
  };

  return (
    // ... your JSX remains the same
    <div className="profile-page-container-main flex items-center justify-center">
      <div className="profile-page-container container">
        
        <div className="top-section">
          <h1>Your Profile</h1>
          
          <div className="profile-card">
            <div className="profile-icon">{initial}</div>
            <div className="profile-info">
              <h5>{fullName}</h5>
              <button className="logout-btn" onClick={handleLogout}>
                <img src="/images/logout-icon-profile.svg" alt="Logout" />
                <p>Logout</p>
              </button>
            </div>
          </div>
        </div>

        <div className="buttons-container flex gap-4">
          <button
            className="purchase-history-btn"
            onClick={() => router.push("/profile/purchase-history")}
          >
            <img src="/images/history-icon-profile.svg" alt="History" />
            <p>Purchase History</p>
          </button>

          {isUserBoarded && (
            <button
              className="my-rent-btn purchase-history-btn" 
              onClick={() => router.push("/profile/my-rent")}
            >
              <img src="/images/my-rent-icon.svg" alt="My Rent" /> 
              <p>My Rent</p>
            </button>
          )}
        </div>

        <div className="personal-details-container">
          <h2>Personal Details</h2>
          
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={phone}
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              readOnly
            />
          </div>

          <div className="action-buttons-container">
            <button className="edit-profile-btn" onClick={handleEditProfile}>
              Edit Profile Details
            </button>
            <button
              className="change-password-btn"
              onClick={handlePassword}
            >
              {needsSetPassword ? "Set Password" : "Change Password"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default page;
