"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { databases, Query, AppwriteException } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import './style.scss'; // Imports app/(admin)/all-users/style.scss

interface UserProfileDocument extends Models.Document {
  userId: string;
  name: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  userType?: 'Normal' | 'Inmate';
  isBoarded?: boolean;
}

interface UserDisplayItem {
  id: string; // Appwrite document $id from "profiles" collection
  appwriteAuthUserId: string; // Appwrite Auth user ID
  name: string;
  phone: string;
  email: string;
  userType: 'Normal' | 'Inmate';
  isBoarded: boolean;
}

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;

export default function AllUsersPage() {
  const [allUsers, setAllUsers] = useState<UserDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const router = useRouter();
  const [isProcessingBoardingAction, setIsProcessingBoardingAction] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!APPWRITE_DATABASE_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
          throw new Error("Appwrite Database or Profiles Collection ID is not configured.");
        }

        const response = await databases.listDocuments<UserProfileDocument>(
          APPWRITE_DATABASE_ID,
          APPWRITE_PROFILES_COLLECTION_ID
        );

        const mappedUsers: UserDisplayItem[] = response.documents.map(doc => ({
          id: doc.$id,
          appwriteAuthUserId: doc.userId,
          name: doc.name,
          phone: doc.phone,
          email: doc.email,
          userType: doc.userType || 'Normal',
          isBoarded: doc.isBoarded || false,
        }));
        setAllUsers(mappedUsers);

      } catch (e: any) {
        console.error("Failed to fetch users:", e);
        setError(e instanceof AppwriteException ? `Appwrite Error: ${e.message} (Code: ${e.code})` : e.message || "Could not load users.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);


  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchTermLower) ||
        user.phone.includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower)
      );
    });
  }, [allUsers, searchTerm]);

  const handleViewFullDetails = (profileDocumentId: string) => {
    const userToView = allUsers.find(u => u.id === profileDocumentId);
    if (userToView) {
      router.push(`/admin/all-users/${userToView.appwriteAuthUserId}`);
    } else {
        console.error("Could not find user details for redirection.");
    }
  };

  const handleBoardingAction = async (user: UserDisplayItem) => {
    setError(null);

    if (user.isBoarded) {
      const confirmOffboard = window.confirm(
        `Are you sure you want to off-board ${user.name}? This will end their current tenancy.`
      );
      if (!confirmOffboard) return;

      setIsProcessingBoardingAction(user.id);
      try {
        if (!APPWRITE_TENANCIES_COLLECTION_ID) {
          throw new Error("Tenancies Collection ID is not configured.");
        }

        const tenancyResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TENANCIES_COLLECTION_ID,
          [
            Query.equal('userId', user.appwriteAuthUserId),
            Query.equal('status', 'Active'),
            Query.limit(1)
          ]
        );

        const tenancyId = tenancyResponse.documents.length > 0 ? tenancyResponse.documents[0].$id : null;

        if (tenancyId) {
            const apiResponse = await fetch('/api/admin/tenancy/end', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenancyId: tenancyId,
                profileDocId: user.id,
              }),
            });

            const result = await apiResponse.json();
            if (!apiResponse.ok) {
              throw new Error(result.details || result.error || 'Failed to off-board user via API.');
            }
            alert(`${user.name} has been successfully off-boarded.`);
        } else {
            console.warn(`No active tenancy found for ${user.name} to delete. Updating profile directly.`);
            await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                user.id,
                {
                    isBoarded: false,
                    stayingPropertyName: null,
                    stayingRoomType: null,
                    stayingRoomTier: null,
                    stayingRent: null,
                }
            );
            alert(`${user.name} was marked as off-boarded (profile updated directly as no active tenancy was found).`);
        }

        setAllUsers(prevUsers =>
          prevUsers.map(u =>
            u.id === user.id ? { ...u, isBoarded: false } : u
          )
        );

      } catch (e: any) {
        console.error("Failed to off-board user:", e);
        const errorMessage = e.message || "Could not off-board user.";
        setError(errorMessage);
        alert(`Error off-boarding user: ${errorMessage}`);
      } finally {
        setIsProcessingBoardingAction(null);
      }
    } else {
      router.push(`/admin/on-board-user?userId=${user.appwriteAuthUserId}&name=${encodeURIComponent(user.name)}`);
    }
  };

  if (isLoading) {
    return (
        <div className="all-users-page">
            <h1 className="page-title">Users</h1>
            <div style={{ textAlign: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>Loading users...</div>
        </div>
    );
  }

  if (error && !isLoading) {
    return (
        <div className="all-users-page">
            <h1 className="page-title">Users</h1>
            <div style={{ textAlign: 'center', padding: '2rem', color: 'red', fontFamily: 'sans-serif' }}>Error: {error}</div>
        </div>
    );
  }

  return (
    <div className="all-users-page">
      <h1 className="page-title">Users</h1>

      <div className="filters-container">
        <div className="search-filter-group">
          <input
            type="text"
            placeholder="Search by Name, Phone, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {error && <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Details</th>
              <th>Boarding Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="Name">{user.name}</td>
                  <td data-label="Phone">{user.phone}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Details">
                    <button
                      className="details-button"
                      onClick={() => handleViewFullDetails(user.id)}
                    >
                      Full Details
                    </button>
                  </td>
                  <td data-label="Boarding Action">
                    <button
                      className={`status-action-button ${user.isBoarded ? 'action-offboard' : 'action-onboard'}`}
                      onClick={() => handleBoardingAction(user)}
                      disabled={isProcessingBoardingAction === user.id}
                    >
                      {isProcessingBoardingAction === user.id
                        ? 'Processing...'
                        : user.isBoarded
                        ? 'Off-board User'
                        : 'On-board User'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="no-results-message">
                    {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}