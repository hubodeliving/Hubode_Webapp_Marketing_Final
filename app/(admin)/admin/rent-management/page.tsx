// File: app/(admin)/rent-management/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { databases, Query, AppwriteException } from '@/lib/appwrite'; // Import Appwrite
import type { Models } from 'appwrite'; // For typing
import './style.scss';

// --- INTERFACES ---

// Interface for documents from your "Tenancies" collection in Appwrite
interface TenancyAppwriteDocument extends Models.Document {
  userId: string;           // Appwrite Auth User ID (links to profiles)
  profileDocId: string;     // $id of the document in the "profiles" collection
  propertyName: string;
  // roomType and tierName might be here if denormalized during onboarding, or fetched via sanityPropertyId etc.
  occupancyName: string;    // Denormalized from on-boarding
  tierName: string;         // Denormalized from on-boarding
  rentAmount: number;
  currency: string;
  onboardingDate: string;   // ISO DateTime string
  status: "Active" | "Ended" | "Upcoming"; // Or your defined tenancy statuses
  dueDate?: string;         // Optional: Next rent due date
  lastPaymentDate?: string; // Optional: Last payment date
}

// Interface for Profile Document from Appwrite "profiles" collection
interface UserProfileAppwriteDocument extends Models.Document {
    userId: string; // The Appwrite Auth User ID
    name: string;
    email: string;
    phone: string;
    // isBoarded?: boolean; // This info is now primarily managed by the existence of an Active Tenancy
}

// Interface for the data displayed in the table (combined data)
interface RentDisplayEntry {
  tenancyId: string; // $id of the Tenancy document
  appwriteAuthUserId: string; // The Appwrite Auth User ID
  tenantName: string;
  propertyName: string;
  phone: string;
  email: string;
  rentStatus: 'Paid' | 'Due'; // This will likely be determined by more complex logic later
                              // For now, we can mock it or derive from a tenancy field if you add one.
  // For the "Manage" button, we might pass the tenancyId or userId
  // For display in modal or manage page:
  roomInfo: string; // e.g., "Single - Premium"
  rentAmountDisplay: string; // e.g., "₹20,000 per month"
  rawTenancyDetails: TenancyAppwriteDocument;
  rawProfileDetails?: UserProfileAppwriteDocument;
}


const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;

export default function RentManagementPage() {
  const [rentEntries, setRentEntries] = useState<RentDisplayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Due'>('All'); // Rent payment status
  const [filterProperty, setFilterProperty] = useState<string>('');
  const router = useRouter();

  const fetchAndCombineRentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!APPWRITE_DATABASE_ID || !APPWRITE_TENANCIES_COLLECTION_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
        throw new Error("Appwrite Database or Collection IDs are not configured.");
      }

      // 1. Fetch all "Active" Tenancies
      const tenanciesResponse = await databases.listDocuments<TenancyAppwriteDocument>(
        APPWRITE_DATABASE_ID,
        APPWRITE_TENANCIES_COLLECTION_ID,
        [
          Query.equal('status', 'Active'), // Only fetch active tenancies
          Query.orderDesc('$createdAt')   // Or order by another relevant field
        ]
      );
      const activeTenancies = tenanciesResponse.documents;

      if (activeTenancies.length === 0) {
        setRentEntries([]);
        setIsLoading(false);
        return;
      }

      // 2. Get unique user IDs from these active tenancies
      const userIds = [...new Set(activeTenancies.map(t => t.userId))];

      // 3. Fetch corresponding profiles
      const profilesResponse = await databases.listDocuments<UserProfileAppwriteDocument>(
        APPWRITE_DATABASE_ID,
        APPWRITE_PROFILES_COLLECTION_ID,
        [
          Query.equal('userId', userIds), // Fetch profiles for these users
          Query.limit(userIds.length)     // Ensure we get all of them
        ]
      );
      const profilesMap = new Map<string, UserProfileAppwriteDocument>();
      profilesResponse.documents.forEach(profile => {
        profilesMap.set(profile.userId, profile);
      });

      // 4. Combine data
      const combinedEntries: RentDisplayEntry[] = activeTenancies.map(tenancy => {
        const userProfile = profilesMap.get(tenancy.userId);
        // Mock rentStatus for now. In a real system, this would come from payment records.
        const mockRentStatus = Math.random() > 0.5 ? 'Paid' : 'Due'; 

        return {
          tenancyId: tenancy.$id,
          appwriteAuthUserId: tenancy.userId,
          tenantName: userProfile?.name || `User (${tenancy.userId.slice(0,6)}...)`,
          propertyName: tenancy.sanityPropertyName +' - '+ tenancy.occupancyName +' '+ tenancy.tierName,
          phone: userProfile?.phone || 'N/A',
          email: userProfile?.email || 'N/A',
          rentStatus: mockRentStatus, // Replace with actual logic later
          roomInfo: `${tenancy.occupancyName} - ${tenancy.tierName}`,
          rentAmountDisplay: `${tenancy.currency} ${tenancy.rentAmount.toLocaleString('en-IN')} /month`,
          rawTenancyDetails: tenancy,
          rawProfileDetails: userProfile,
        };
      });

      setRentEntries(combinedEntries);

    } catch (e: any) {
      console.error("Failed to fetch rent management data:", e);
      setError(e instanceof AppwriteException ? `Appwrite Error: ${e.message} (Code: ${e.code})` : e.message || "Could not load data.");
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - fetch once on mount

  useEffect(() => {
    fetchAndCombineRentData();
  }, [fetchAndCombineRentData]);


  const propertyOptions = useMemo(() => {
    if (isLoading || rentEntries.length === 0) return ['All'];
    return ['All', ...new Set(rentEntries.map(r => r.propertyName))];
  }, [rentEntries, isLoading]);

  const statusOptions: Array<'All' | 'Paid' | 'Due'> = ['All', 'Paid', 'Due']; // Rent payment status

  const filteredRentEntries = useMemo(() => {
    return rentEntries.filter(entry => {
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = (
        entry.tenantName.toLowerCase().includes(searchTermLower) ||
        entry.propertyName.toLowerCase().includes(searchTermLower) ||
        entry.phone.includes(searchTermLower) ||
        entry.email.toLowerCase().includes(searchTermLower)
      );
      const statusMatch = filterStatus === 'All' || entry.rentStatus === filterStatus;
      const propertyMatch = filterProperty === '' || filterProperty === 'All' || entry.propertyName === filterProperty;
      return searchMatch && statusMatch && propertyMatch;
    });
  }, [rentEntries, searchTerm, filterStatus, filterProperty]);

  const handleManageRent = (tenancyId: string, appwriteAuthUserId: string) => {
    console.log(`Navigate to manage rent for Tenancy ID: ${tenancyId}, User ID: ${appwriteAuthUserId}`);
    // Example: router.push(`/admin/rent-management/${tenancyId}?userId=${appwriteAuthUserId}`);
    // For now, using the dynamic segment [rentEntryId] you had in your structure
    // Assuming rentEntryId will be the tenancyId
    router.push(`/admin/rent-management/${tenancyId}`);
    alert(`Manage rent for Tenancy ID: ${tenancyId} (Placeholder - Page to be built)`);
  };

  if (isLoading) { /* ... Loading UI ... */ }
  if (error) { /* ... Error UI ... */ }

  // --- JSX Return ---
  return (
    <div className="rent-management-page">
      <h1 className="page-title">Rent Management</h1>
      <div className="filters-container">
        <div className="search-filter-group">
          <input type="text" placeholder="Search by Name, Property, Phone, Email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
        </div>
        <div className="filter-group">
          <select id="statusFilterRent" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'All' | 'Paid' | 'Due')}>
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <select id="propertyFilterRent" value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}>
            {propertyOptions.map(opt => <option key={opt} value={opt === 'All' ? '' : opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="rent-table-wrapper">
        <table className="rent-table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Property Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Manage</th> {/* This button will lead to the detail page */}
              <th>Rent Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRentEntries.length > 0 ? (
              filteredRentEntries.map((entry) => (
                <tr key={entry.tenancyId}>
                  <td data-label="Tenant Name">{entry.tenantName}</td>
                  <td data-label="Property Name">{entry.propertyName}</td>
                  <td data-label="Phone">{entry.phone}</td>
                  <td data-label="Email">{entry.email}</td>
                  <td data-label="Manage">
                    <button className="manage-button" onClick={() => handleManageRent(entry.tenancyId, entry.appwriteAuthUserId)}>
                      Manage
                    </button>
                  </td>
                  <td data-label="Rent Status">
                    <StatusBadge status={entry.rentStatus} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-results-message">
                  {searchTerm || filterStatus !== 'All' || filterProperty ? 'No entries match criteria.' : 'No active tenancies found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}