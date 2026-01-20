// File: app/(admin)/registrations/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import { databases, Query, AppwriteException, ID } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import './style.scss';

// Interface for Reservation Document from Appwrite 'reservations' collection
interface ReservationAppwriteDocument extends Models.Document {
  userId: string; // Key to link to profiles collection
  propertyId: string;
  propertyName: string;
  selectedTierKey: string;
  selectedTierName: string;
  occupancyName: string;
  amountPaid: number;
  currency: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string; // Optional as per your previous setup
  status: 'New' | 'In Progress' | 'Closed' | 'Cancelled';
  reservationTimestamp: string; // ISO String
  notes?: string;
}

// Interface for Profile Document from Appwrite 'profiles' collection
// Ensure these field names EXACTLY match your 'profiles' collection attributes
interface UserProfileDocument extends Models.Document {
    userId: string; // The Appwrite Auth User ID, used for linking
    name: string;   // User's full name
    email: string;  // User's email
    phone: string;  // User's phone number
    // any other fields in your profiles collection that might be useful
}

// Combined interface for display in the table and modal
interface RegistrationDisplayItem {
  id: string; // Appwrite reservation document $id
  name: string;
  propertyName: string;
  phone: string;
  email: string; // Changed from optional as we expect it from profiles
  roomType: string;
  status: 'New' | 'In Progress' | 'Closed' | 'Cancelled';
  fullReservationDetails: ReservationAppwriteDocument; // Raw reservation doc
  userProfileDetails?: UserProfileDocument; // Raw profile doc, optional if fetch fails
}

// Modal Component Props & Implementation
interface FullDetailsModalProps {
    displayItem: RegistrationDisplayItem | null; // Pass the combined display item
    onClose: () => void;
}
const FullDetailsModal: React.FC<FullDetailsModalProps> = ({ displayItem, onClose }) => {
    if (!displayItem) return null;

    const reservationData = displayItem.fullReservationDetails; // reservation specific data
    // User details are now directly on displayItem from the profiles fetch
    const userName = displayItem.name;
    const userPhone = displayItem.phone;
    const userEmail = displayItem.email;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-button" onClick={onClose}>×</button>
                <h2>Registration Details</h2>
                <p><strong>Reg. ID:</strong> {reservationData.$id}</p>
                <p><strong>User ID:</strong> {reservationData.userId}</p>
                <p><strong>Name:</strong> {userName}</p>
                <p><strong>Phone:</strong> {userPhone}</p>
                <p><strong>Email:</strong> {userEmail}</p>
                <hr/>
                <p><strong>Property Name:</strong> {reservationData.propertyName}</p>
                <p><strong>Property ID:</strong> {reservationData.propertyId}</p>
                <p><strong>Occupancy:</strong> {reservationData.occupancyName}</p>
                <p><strong>Tier:</strong> {reservationData.selectedTierName}</p>
                <p><strong>Tier Key:</strong> {reservationData.selectedTierKey}</p>
                <hr/>
                <p><strong>Amount Paid:</strong> {reservationData.currency} {reservationData.amountPaid}</p>
                <p><strong>Razorpay Payment ID:</strong> {reservationData.razorpayPaymentId}</p>
                <p><strong>Razorpay Order ID:</strong> {reservationData.razorpayOrderId}</p>
                <p><strong>Status:</strong> <StatusBadge status={reservationData.status} /></p>
                <p><strong>Timestamp:</strong> {new Date(reservationData.reservationTimestamp).toLocaleString()}</p>
                <p><strong>Notes:</strong> {reservationData.notes || 'N/A'}</p>
            </div>
        </div>
    );
};

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_RESERVATIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_RESERVATIONS_COLLECTION_ID!;
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;

export default function RegistrationsPage() {
  const [allRegistrations, setAllRegistrations] = useState<RegistrationDisplayItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterProperty, setFilterProperty] = useState<string>('');

  const [selectedRegItemForModal, setSelectedRegItemForModal] = useState<RegistrationDisplayItem | null>(null);
  const [editingStatusForId, setEditingStatusForId] = useState<string | null>(null);

  const fetchAndCombineData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!APPWRITE_DATABASE_ID || !APPWRITE_RESERVATIONS_COLLECTION_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
        throw new Error("Appwrite Database/Collection IDs are not configured properly in .env.local");
      }

      // 1. Fetch all reservations
      const reservationResponse = await databases.listDocuments<ReservationAppwriteDocument>(
        APPWRITE_DATABASE_ID,
        APPWRITE_RESERVATIONS_COLLECTION_ID,
        [Query.orderDesc('reservationTimestamp')] // Example query
      );
      const reservationDocs = reservationResponse.documents;

      if (reservationDocs.length === 0) {
        setAllRegistrations([]);
        setIsLoading(false);
        return;
      }

      // 2. Get unique user IDs from reservations
      const userIds = [...new Set(reservationDocs.map(r => r.userId))];

      // 3. Fetch profiles for these user IDs
      // Appwrite's Query.equal can take an array of values for a single attribute
      const profilesResponse = await databases.listDocuments<UserProfileDocument>(
        APPWRITE_DATABASE_ID,
        APPWRITE_PROFILES_COLLECTION_ID,
        [Query.equal('userId', userIds), Query.limit(userIds.length)] // Fetch all matching profiles
      );
      
      const profilesMap = new Map<string, UserProfileDocument>();
      profilesResponse.documents.forEach(profile => {
        profilesMap.set(profile.userId, profile);
      });

      // 4. Combine reservation data with profile data
      const combinedData: RegistrationDisplayItem[] = reservationDocs.map(resDoc => {
        const userProfile = profilesMap.get(resDoc.userId);
        return {
          id: resDoc.$id,
          name: userProfile?.name || `User (${resDoc.userId.slice(0, 6)}...)`, // Fallback name
          propertyName: resDoc.propertyName,
          phone: userProfile?.phone || 'N/A', // Fallback phone
          email: userProfile?.email || 'N/A', // Fallback email
          roomType: `${resDoc.occupancyName} - ${resDoc.selectedTierName}`,
          status: resDoc.status,
          fullReservationDetails: resDoc,
          userProfileDetails: userProfile, // Store for modal if needed, or just use mapped fields
        };
      });

      setAllRegistrations(combinedData);

    } catch (e: any) {
      console.error("Failed to fetch data for registrations page:", e);
      setError(e instanceof AppwriteException ? `Appwrite Error: ${e.message} (Code: ${e.code})` : e.message || "Could not load data.");
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed if env vars are stable, or add them if they can change at runtime (unlikely for env)

  useEffect(() => {
    fetchAndCombineData();
  }, [fetchAndCombineData]);


  const propertyOptions = useMemo(() => {
    if (isLoading || !allRegistrations || allRegistrations.length === 0) return ['All'];
    const properties = new Set(allRegistrations.map(r => r.propertyName));
    return ['All', ...Array.from(properties)];
  }, [allRegistrations, isLoading]);

  const statusOptions: Array<ReservationAppwriteDocument['status'] | 'All'> = ['All', 'New', 'In Progress', 'Closed', 'Cancelled'];

  const filteredRegistrations = useMemo(() => {
    return allRegistrations.filter(reg => {
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = (
        reg.name.toLowerCase().includes(searchTermLower) ||
        reg.propertyName.toLowerCase().includes(searchTermLower) ||
        reg.phone.toLowerCase().includes(searchTermLower) || // Can make phone search case-insensitive
        (reg.email && reg.email.toLowerCase().includes(searchTermLower)) ||
        reg.roomType.toLowerCase().includes(searchTermLower) ||
        reg.id.toLowerCase().includes(searchTermLower)
      );
      const statusMatch = !filterStatus || filterStatus === 'All' || reg.status === filterStatus;
      const propertyMatch = !filterProperty || filterProperty === 'All' || reg.propertyName === filterProperty;
      return searchMatch && statusMatch && propertyMatch;
    });
  }, [allRegistrations, searchTerm, filterStatus, filterProperty]);


  const handleStatusChange = async (registrationId: string, newStatus: ReservationAppwriteDocument['status']) => {
    const originalRegistrations = JSON.parse(JSON.stringify(allRegistrations)); // Deep copy for revert
    setAllRegistrations(prevRegs =>
      prevRegs.map(r => (r.id === registrationId ? { ...r, status: newStatus, fullReservationDetails: {...r.fullReservationDetails, status: newStatus} } : r))
    );
    setEditingStatusForId(null);
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID, APPWRITE_RESERVATIONS_COLLECTION_ID, registrationId, { status: newStatus }
      );
      console.log(`Registration ${registrationId} status updated to ${newStatus}`);
    } catch (e: any) {
      console.error("Failed to update registration status:", e);
      alert(`Error updating status: ${e.message || 'Please try again.'}`);
      setAllRegistrations(originalRegistrations);
    }
  };

  const openDetailsModal = (registrationItem: RegistrationDisplayItem) => {
    setSelectedRegItemForModal(registrationItem);
  };
  const closeDetailsModal = () => {
    setSelectedRegItemForModal(null);
  };


  if (isLoading && allRegistrations.length === 0) {
    return (
        <div className="registrations-page">
            <h1 className="page-title">Registrations Overview</h1>
            <div style={{ textAlign: 'center', padding: '2rem', fontFamily: 'sans-serif' }}>Loading registrations...</div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="registrations-page">
            <h1 className="page-title">Registrations Overview</h1>
            <div style={{ textAlign: 'center', padding: '2rem', color: 'red', fontFamily: 'sans-serif' }}>Error: {error}</div>
        </div>
    );
  }

  return (
    <div className="registrations-page">
      <h1 className="page-title">Registrations Overview</h1>
      <div className="filters-container">
        <div className="search-filter-group">
          <input type="text" placeholder="Search by Name, Property, Phone, Email, Room, ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input"/>
        </div>
        <div className="filter-group">
          <select id="statusFilter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {statusOptions.map(opt => <option key={opt} value={opt === 'All' ? '' : opt}>{opt}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <select id="propertyFilter" value={filterProperty} onChange={(e) => setFilterProperty(e.target.value)}>
            {propertyOptions.map(opt => <option key={opt} value={opt === 'All' ? '' : opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="registrations-table-wrapper">
        <table className="registrations-table">
          <thead><tr><th>Name</th><th>Property Name</th><th>Phone</th><th>Room Type</th><th>Details</th><th>Status</th></tr></thead>
          <tbody>
            {filteredRegistrations.length > 0 ? (
              filteredRegistrations.map((reg) => (
                <tr key={reg.id}>
                  <td data-label="Name">{reg.name}</td>
                  <td data-label="Property Name">{reg.propertyName}</td>
                  <td data-label="Phone">{reg.phone}</td>
                  <td data-label="Room Type">{reg.roomType}</td>
                  <td data-label="Details">
                    <button className="details-button" onClick={() => openDetailsModal(reg)}> Full Details </button>
                  </td>
                  <td data-label="Status" className="status-cell">
                    {editingStatusForId === reg.id ? (
                        <select value={reg.status} onChange={(e) => handleStatusChange(reg.id, e.target.value as ReservationAppwriteDocument['status'])} onBlur={() => setEditingStatusForId(null)} autoFocus className="status-dropdown-select">
                            {(['New', 'In Progress', 'Closed', 'Cancelled'] as ReservationAppwriteDocument['status'][]).map(s => (<option key={s} value={s}>{s}</option>))}
                        </select>
                    ) : (<div onClick={() => setEditingStatusForId(reg.id)} className="status-badge-clickable"><StatusBadge status={reg.status} /></div>)}
                  </td>
                </tr>
              ))
            ) : (<tr><td colSpan={6} className="no-results-message">{searchTerm || filterStatus || filterProperty ? 'No registrations found matching filters.' : 'No registrations yet.'}</td></tr>)}
          </tbody>
        </table>
      </div>
      <FullDetailsModal displayItem={selectedRegItemForModal} onClose={closeDetailsModal} />
    </div>
  );
}