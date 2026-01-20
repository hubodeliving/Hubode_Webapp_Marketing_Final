// File: app/(admin)/rent-management/[rentEntryId]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { databases, Query, AppwriteException } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import './style.scss';

// --- INTERFACES ---

// For Tenancy document fetched from Appwrite
interface TenancyAppwriteDocument extends Models.Document {
  userId: string;
  profileDocId: string;
  sanityPropertyName: string; // <<<< Assuming this is the correct key in your "Tenancies" collection for property name
  // sanityPropertyName?: string; // Only if you also have this for some reason
  occupancyName: string;
  tierName: string;
  rentAmount: number;
  currency: string;
  onboardingDate: string; // ISO String
  status: "Active" | "Ended" | "Upcoming";
  paymentYear: number;    // The year these paidMonths apply to
  paidMonths: string[];   // Months paid FOR THE paymentYear
  dueDate?: string;
  lastPaymentDate?: string;
}

// For Profile document fetched from Appwrite
interface UserProfileAppwriteDocument extends Models.Document {
    userId: string;
    name: string;
    email: string;
    phone: string;
}

// Combined data structure for the page's state
interface RentPaymentPageDetail {
  tenancyId: string;
  user: {
    id: string;
    profileDocId: string;
    name: string;
    phone: string;
    email: string;
  };
  propertyInfo: {
    propertyName: string; // This will come from tenancyDoc.propertyName
    roomType: string;
    roomTier: string;
    rent: string;
    onboardingDate: string;
  };
  paymentYear: number;
  paidMonthsInitial: string[];
}

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;

const formatDate = (isoString: string): string => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return 'Invalid Date'; }
};

const ALL_MONTHS: string[] = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function ManageRentPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const tenancyDocumentId = params.rentEntryId as string;

  const [rentPageDetail, setRentPageDetail] = useState<RentPaymentPageDetail | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [currentPaymentYear, setCurrentPaymentYear] = useState<number>(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const availableYears = useMemo(() => {
    const currentYr = new Date().getFullYear();
    return [currentYr -1, currentYr, currentYr + 1, currentYr + 2];
  }, []);

  const fetchAndProcessData = useCallback(async (tenancyId: string, yearToFetch: number) => {
    if (!tenancyId) { setError("Tenancy ID is missing."); setIsLoading(false); return; }
    setIsLoading(true); setError(null);
    try {
        if (!APPWRITE_DATABASE_ID || !APPWRITE_TENANCIES_COLLECTION_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
            throw new Error("Appwrite environment variables not configured.");
        }
        const tenancyDoc = await databases.getDocument<TenancyAppwriteDocument>(
            APPWRITE_DATABASE_ID, APPWRITE_TENANCIES_COLLECTION_ID, tenancyId
        );
        if (!tenancyDoc) throw new Error(`Tenancy record with ID ${tenancyId} not found.`);

        const profileResponse = await databases.listDocuments<UserProfileAppwriteDocument>(
            APPWRITE_DATABASE_ID, APPWRITE_PROFILES_COLLECTION_ID,
            [Query.equal('userId', tenancyDoc.userId), Query.limit(1)]
        );
        if (profileResponse.documents.length === 0) throw new Error(`Profile not found for user ID: ${tenancyDoc.userId}`);
        const userProfileDoc = profileResponse.documents[0];

        let initialPaidMonthsForYear: string[] = [];
        // If the fetched tenancyDoc's paymentYear matches the year we are currently trying to view/manage,
        // then use its paidMonths. Otherwise, for a new year, start with no months paid.
        if (tenancyDoc.paymentYear === yearToFetch) {
            initialPaidMonthsForYear = tenancyDoc.paidMonths || [];
        }

        const pageData: RentPaymentPageDetail = {
            tenancyId: tenancyDoc.$id,
            user: {
                id: userProfileDoc.userId, profileDocId: userProfileDoc.$id,
                name: userProfileDoc.name, phone: userProfileDoc.phone, email: userProfileDoc.email,
            },
            propertyInfo: {
                propertyName: tenancyDoc.sanityPropertyName || "Unknown Property", // <<<< USING propertyName
                roomType: tenancyDoc.occupancyName || "N/A",
                roomTier: tenancyDoc.tierName || "N/A",
                rent: tenancyDoc.rentAmount ? tenancyDoc.rentAmount.toString() : "0",
                onboardingDate: formatDate(tenancyDoc.onboardingDate),
            },
            paymentYear: yearToFetch, // This is the year we are currently managing for
            paidMonthsInitial: initialPaidMonthsForYear,
        };
        setRentPageDetail(pageData);
        setSelectedMonths(new Set(initialPaidMonthsForYear));
        // setCurrentPaymentYear(yearToFetch); // Already set by handleYearChange or initial state
    } catch (err: any) {
        console.error("[ManageRent] Error fetching rent details:", err);
        setError(err instanceof AppwriteException ? `Appwrite: ${err.message}` : err.message || 'Failed to load details.');
    } finally { setIsLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed currentPaymentYear from here, it's passed as an arg

  useEffect(() => { // Initial data fetch
    if (tenancyDocumentId) {
      fetchAndProcessData(tenancyDocumentId, currentPaymentYear);
    } else {
        setError("Tenancy ID not found in URL.");
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenancyDocumentId]); // Only depends on tenancyDocumentId for initial fetch

  useEffect(() => { // Re-fetches or resets data when currentPaymentYear (from dropdown) changes
    if (tenancyDocumentId && rentPageDetail) { // Ensure initial data is loaded
        // If the displayed year in rentPageDetail is different from the selected year
        if (rentPageDetail.paymentYear !== currentPaymentYear || selectedMonths.size === 0 && currentPaymentYear !== rentPageDetail.paymentYear) {
            console.log(`Year changed to ${currentPaymentYear}. Fetching/Resetting paid months for this year.`);
            // Re-fetch data specifically for the new year.
            // This assumes your tenancy document might have different paidMonths for different paymentYears,
            // or you adjust `fetchAndProcessData` to handle this.
            // For now, this will effectively re-fetch the tenancy and if its stored year is different,
            // it will reset paidMonths. If the stored year is the same, it will re-apply paidMonths.
            // More robust logic might be needed if a single tenancy doc can't hold multiple years of payment history.
             fetchAndProcessData(tenancyDocumentId, currentPaymentYear);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPaymentYear, tenancyDocumentId]); // Removed rentPageDetail, fetchAndProcessData from deps to avoid loops


  const handleMonthCheckboxChange = (month: string) => {
    setSelectedMonths(prevMonths => {
      const newMonths = new Set(prevMonths);
      if (newMonths.has(month)) newMonths.delete(month);
      else newMonths.add(month);
      return newMonths;
    });
  };

  const handleSavePayments = async () => {
    if (!rentPageDetail) { setError("Rent details not loaded."); return; }
    setIsSaving(true); setError(null);
    const updatedPaidMonths = Array.from(selectedMonths);

    const payload = {
        tenancyId: rentPageDetail.tenancyId,
        paymentYear: currentPaymentYear, // Use the state for the currently viewed/edited year
        paidMonths: updatedPaidMonths,
    };
    console.log(`[ManageRentPage] Saving payments:`, payload);
    try {
      const response = await fetch('/api/admin/rent-payment/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || `Server error ${response.status}`);
      
      setRentPageDetail(prev => {
        if (!prev) return null;
        return { ...prev, paidMonthsInitial: [...updatedPaidMonths], paymentYear: currentPaymentYear };
      });
      alert("Rent payments updated successfully!");
    } catch (apiError: any) {
      console.error("Error saving payments:", apiError);
      setError(`Failed to update: ${apiError.message || "Please try again."}`);
    } finally { setIsSaving(false); }
  };
  
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPaymentYear(parseInt(e.target.value, 10));
    // The useEffect watching currentPaymentYear will now trigger data re-fetch/reset
  };

  const handleRemoveFromRent = async () => {
    if (!rentPageDetail || !rentPageDetail.tenancyId || !rentPageDetail.user.profileDocId) {
      setError("Cannot perform action: Essential details are missing.");
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to end the tenancy for ${rentPageDetail.user.name} at ${rentPageDetail.propertyInfo.propertyName}?\nThis will remove their tenancy record and mark their profile as no longer boarded.`
    );

    if (isConfirmed) {
      setIsSaving(true); // Use isSaving to disable buttons during the operation
      setError(null);
      try {
        const response = await fetch('/api/admin/tenancy/end', { // New API endpoint
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenancyId: rentPageDetail.tenancyId,
            profileDocId: rentPageDetail.user.profileDocId, // Pass profileDocId to update profile
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.details || result.error || `Server error ${response.status}`);
        }

        alert("Tenancy ended successfully. User profile updated.");
        // After successful removal, redirect the admin, perhaps to the main rent management list
        router.push('/admin/rent-management');

      } catch (apiError: any) {
        console.error("Error ending tenancy:", apiError);
        setError(`Failed to end tenancy: ${apiError.message || "Please try again."}`);
        setIsSaving(false); // Re-enable buttons on error
      }
      // No finally here, as successful operation redirects
    }
  };

  
  const handleViewPurchaseHistory = () => {
    if (rentPageDetail?.user?.id) router.push(`/admin/all-users/${rentPageDetail.user.id}/purchase-history`);
  };

  if (isLoading) return <div className="loading-state admin-rent-payment-detail-page">Loading rent details...</div>;
  if (error && !rentPageDetail) return <div className="error-state admin-rent-payment-detail-page">Error: {error} <button onClick={() => fetchAndProcessData(tenancyDocumentId, currentPaymentYear)}>Try Again</button></div>;
  if (!rentPageDetail && !isLoading) return <div className="error-state admin-rent-payment-detail-page">Rent details not available.</div>;

  const userInitial = rentPageDetail!.user.name?.charAt(0).toUpperCase() || "";

  return (
    <div className="admin-rent-payment-detail-page">
      <h1 className="page-title">Manage Tenant Rent</h1>
      <div className="content-layout-wrapper">
        <div className="user-header-section">
          <div className="profile-icon">{userInitial}</div>
          <div className="user-name-display"><h5>{rentPageDetail!.user.name}</h5></div>
        </div>

        <div className="action-buttons-row">
          <button className="styled-button history-button" onClick={handleViewPurchaseHistory}>
            <Image src="/images/icons/history-icon.svg" alt="History" width={18} height={18} />
            <span>Reservation History</span>
          </button>
        </div>

        <div className="details-grid">
            <div className="details-column">
                <div className="details-section">
                    <h2>Staying Property Details</h2>
                    <div className="form-group readonly"><label>Property</label><input type="text" value={rentPageDetail!.propertyInfo.propertyName} readOnly disabled={isSaving} /></div>
                    <div className="form-group readonly"><label>Room Type</label><input type="text" value={rentPageDetail!.propertyInfo.roomType} readOnly disabled={isSaving} /></div>
                    <div className="form-group readonly"><label>Room Tier</label><input type="text" value={rentPageDetail!.propertyInfo.roomTier} readOnly disabled={isSaving} /></div>
                    <div className="form-group readonly"><label>On-boarded Date</label><input type="text" value={rentPageDetail!.propertyInfo.onboardingDate} readOnly disabled={isSaving} /></div>
                    <div className="form-group readonly">
                        <label>Rent</label>
                        <div className="rent-display-group">
                            <span className="currency-symbol bold">₹</span>
                            <span className="rent-amount bold large">{parseFloat(rentPageDetail!.propertyInfo.rent).toLocaleString('en-IN')}</span>
                            <span className="rent-suffix">per month</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="details-column">
                <div className="details-section">
                    <h2>Personal Details</h2>
                    <div className="form-group readonly">
                        <label htmlFor={`phone-${rentPageDetail!.tenancyId}`}>Phone</label>
                        <input type="tel" id={`phone-${rentPageDetail!.tenancyId}`} value={rentPageDetail!.user.phone} readOnly disabled={isSaving} />
                    </div>
                    <div className="form-group readonly">
                        <label htmlFor={`email-${rentPageDetail!.tenancyId}`}>Email</label>
                        <input type="email" id={`email-${rentPageDetail!.tenancyId}`} value={rentPageDetail!.user.email} readOnly disabled={isSaving} />
                    </div>
                </div>
            </div>
        </div>

        <div className="rent-payment-section details-section">
          <div className="rent-year-selector form-group">
            <label htmlFor="paymentYearSelect">Payment Year:</label>
            <select 
                id="paymentYearSelect" 
                value={currentPaymentYear} 
                onChange={handleYearChange}
                disabled={isLoading || isSaving}
            >
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <h2>Rent Payments - {currentPaymentYear}</h2>
          <div className="months-checkbox-grid">
            {ALL_MONTHS.map((month) => (
              <div key={month} className="month-checkbox-item">
                <input type="checkbox" id={`month-${month}-${rentPageDetail!.tenancyId}`} name={month}
                  checked={selectedMonths.has(month)}
                  onChange={() => handleMonthCheckboxChange(month)}
                  disabled={isSaving}/>
                <label htmlFor={`month-${month}-${rentPageDetail!.tenancyId}`}>{month}</label>
              </div>
            ))}
          </div>
        </div>

        {error && !isLoading && <p className="form-feedback error page-level-error" role="alert">{error}</p>}
        <div className="main-action-buttons-row">
          <button type="button" className="styled-button save-payments-button" onClick={handleSavePayments} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Payment Status'}
          </button>
          <button type="button" className="styled-button remove-from-rent-button" onClick={handleRemoveFromRent} disabled={isSaving}>
            End Tenancy / Remove
          </button>
        </div>
      </div>
    </div>
  );
}