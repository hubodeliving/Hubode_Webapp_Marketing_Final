"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { databases, Query, AppwriteException } from '@/lib/appwrite';
import type { Models } from 'appwrite';
import './style.scss';

// --- INTERFACES ---
interface TenancyDocument extends Models.Document {
  userId: string;
  profileDocId: string;
  sanityPropertyName: string;
  occupancyName: string;
  tierName: string;
  rentAmount: number;
  currency: string;
  onboardingDate: string;
  status: "Active" | "Ended" | "Upcoming";
  paymentYear?: number;
  paidMonths?: string[];
}

interface AdminSettingsDocument extends Models.Document {
  settingName: string;
  firstReminderDay: number;
  secondReminderDay: number;
  dueDayLogic: string;
  paymentInstructions: string;
  adminContactEmail: string;
  adminContactPhone: string;
  currencySymbol?: string;
}

interface DisplayRentData {
  propertyName: string;
  roomInfo: string;
  monthlyRentAmount: string;
  currencySymbol: string;
  nextMonthRent: {
    monthName: string;
    year: number;
    status: 'Paid' | 'Due';
    dueDate?: string;
  };
  selectedPaymentYearState: number;
  paidMonthsForSelectedYearState: string[];
  availableYearsForDropdown: number[];
  paymentInstructions: string;
  adminContactEmail: string;
  adminContactPhone: string;
}

const ALL_MONTHS: string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Appwrite Configuration
const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const APPWRITE_TENANCIES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TENANCIES_COLLECTION_ID!;

// MODIFICATION: Hardcoding Admin Settings Collection ID as per constraint
const HARDCODED_ADMIN_SETTINGS_COLLECTION_ID = "684156a0002c96e72a8a"; 
// THIS (below) MUST be the ID of the DOCUMENT within the AdminSettings collection.
// Ensure NEXT_PUBLIC_ADMIN_SETTINGS_DOCUMENT_ID in your .env.local file has the correct DOCUMENT ID.
const ADMIN_SETTINGS_DOCUMENT_ID_FROM_ENV = process.env.NEXT_PUBLIC_ADMIN_SETTINGS_DOCUMENT_ID!;


const MyRentPage = () => {
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const [displayData, setDisplayData] = useState<DisplayRentData | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

const calculateNextMonthRentStatus = useCallback((
  tenancy: TenancyDocument | null,
  adminSettings: AdminSettingsDocument | null
): DisplayRentData['nextMonthRent'] => {
  const today = new Date();
  const currentMonthIndex = today.getMonth(); // 0 = Jan, 6 = July
  const currentYear = today.getFullYear();
  const currentMonthName = ALL_MONTHS[currentMonthIndex];

  const paidMonths = tenancy?.paidMonths || [];

  const isPaid = paidMonths.includes(currentMonthName);
  console.log("🧾 currentMonthName =", currentMonthName, "| isPaid =", isPaid, "| paidMonths =", paidMonths);

  let status: 'Paid' | 'Due' = isPaid ? 'Paid' : 'Due';
  let dueDate: string | undefined;

  if (!isPaid && adminSettings) {
    const deadlineDay = adminSettings.secondReminderDay || 30;
    const deadline = new Date(currentYear, currentMonthIndex, deadlineDay);
    dueDate = deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return {
    monthName: currentMonthName,
    year: currentYear,
    status,
    dueDate,
  };
}, []);


  useEffect(() => {
    if (authIsLoading) return;
    if (!currentUser) {
      setError("Please log in to view your rent details.");
      setIsLoadingPage(false);
      return;
    }

    const fetchData = async () => {
      setIsLoadingPage(true);
      setError(null);
      try {
        // Check all required IDs for fetching core data
        if (!APPWRITE_DATABASE_ID || !APPWRITE_TENANCIES_COLLECTION_ID || !HARDCODED_ADMIN_SETTINGS_COLLECTION_ID || !ADMIN_SETTINGS_DOCUMENT_ID_FROM_ENV) {
          throw new Error("Appwrite configuration is missing. Critical IDs are undefined.");
        }

        const settingsDoc = await databases.getDocument<AdminSettingsDocument>(
  APPWRITE_DATABASE_ID,
  HARDCODED_ADMIN_SETTINGS_COLLECTION_ID, // <<< CORRECTED TO UPPERCASE 'L'
  ADMIN_SETTINGS_DOCUMENT_ID_FROM_ENV
);
        if (!settingsDoc) throw new Error("Admin settings not found.");

        const tenancyResponse = await databases.listDocuments<TenancyDocument>(
          APPWRITE_DATABASE_ID,
          APPWRITE_TENANCIES_COLLECTION_ID,
          [
            Query.equal('userId', currentUser.$id),
            Query.equal('status', 'Active'),
            Query.limit(1)
          ]
        );

        if (tenancyResponse.documents.length === 0) {
          setError("No active tenancy found for your account.");
          setIsLoadingPage(false);
          return;
        }
        const tenancyDoc = tenancyResponse.documents[0];
        
        const nextMonthStatusDetails = calculateNextMonthRentStatus(tenancyDoc, settingsDoc);
        const onboardingYear = new Date(tenancyDoc.onboardingDate).getFullYear();
        const currentYear = new Date().getFullYear();
        
        const yearsForDropdown = [];
        for (let y = onboardingYear; y <= Math.max(currentYear, tenancyDoc.paymentYear || currentYear) + 1; y++) {
            yearsForDropdown.push(y);
        }
        if (yearsForDropdown.length === 0) yearsForDropdown.push(currentYear);

        const initialSelectedYear = tenancyDoc.paymentYear || currentYear;
        let initialPaidMonths: string[] = [];
        if (tenancyDoc.paymentYear === initialSelectedYear && tenancyDoc.paidMonths) {
            initialPaidMonths = tenancyDoc.paidMonths;
        }
        
        setDisplayData({
          propertyName: tenancyDoc.sanityPropertyName,
          roomInfo: `${tenancyDoc.occupancyName} - ${tenancyDoc.tierName}`,
          monthlyRentAmount: tenancyDoc.rentAmount.toLocaleString('en-IN'),
          currencySymbol: settingsDoc.currencySymbol || '₹',
          nextMonthRent: nextMonthStatusDetails,
          selectedPaymentYearState: initialSelectedYear,
          paidMonthsForSelectedYearState: initialPaidMonths,
          availableYearsForDropdown: yearsForDropdown,
          paymentInstructions: settingsDoc.paymentInstructions,
          adminContactEmail: settingsDoc.adminContactEmail,
          adminContactPhone: settingsDoc.adminContactPhone,
        });

      } catch (e: any) {
        console.error("Error fetching rent data:", e);
        let message = "Could not load your rent details.";
        if (e instanceof AppwriteException) {
            message = `Appwrite Error (${e.code}): ${e.message}`;
        } else if (e instanceof Error) {
            message = e.message;
        }
        setError(message);
      } finally {
        setIsLoadingPage(false);
      }
    };

    fetchData();
  }, [currentUser, authIsLoading, calculateNextMonthRentStatus]);

  const handleYearChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value, 10);
    if (displayData && currentUser) { // Added currentUser check
        setIsLoadingPage(true);
        try {
            const tenancyResponse = await databases.listDocuments<TenancyDocument>(
              APPWRITE_DATABASE_ID,
              APPWRITE_TENANCIES_COLLECTION_ID,
              [
                Query.equal('userId', currentUser.$id),
                Query.equal('status', 'Active'),
                Query.limit(1)
              ]
            );
            if (tenancyResponse.documents.length > 0) {
                const tenancyDoc = tenancyResponse.documents[0];
                let newPaidMonths: string[] = [];
                if (tenancyDoc.paymentYear === year && tenancyDoc.paidMonths) {
                    newPaidMonths = tenancyDoc.paidMonths;
                }
                 setDisplayData(prev => prev ? ({
                    ...prev,
                    selectedPaymentYearState: year,
                    paidMonthsForSelectedYearState: newPaidMonths,
                }) : null);
            } else {
                 setDisplayData(prev => prev ? ({
                    ...prev,
                    selectedPaymentYearState: year,
                    paidMonthsForSelectedYearState: [],
                }) : null);
            }
        } catch (fetchError) {
            console.error("Error re-fetching tenancy for year change:", fetchError);
            setError("Could not update payment history for the selected year.");
        } finally {
            setIsLoadingPage(false);
        }
    }
  };
  
  if (isLoadingPage || authIsLoading) {
    return (
      <div className="my-rent-page-wrapper margin-top">
        <div className="my-rent-container container">
          <div className="page-title-container"><h1>My Rent</h1></div>
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading your rent details...</p>
        </div>
      </div>
    );
  }

  if (error || !displayData) {
    return (
      <div className="my-rent-page-wrapper margin-top">
        <div className="my-rent-container container">
          <div className="page-title-container"><h1>My Rent</h1></div>
          <p style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
            {error || "Rent information is currently unavailable. Please try again later or contact support."}
          </p>
        </div>
      </div>
    );
  }

  const { 
    propertyName, roomInfo, monthlyRentAmount, currencySymbol,
    nextMonthRent, selectedPaymentYearState, paidMonthsForSelectedYearState,
    availableYearsForDropdown, paymentInstructions, adminContactEmail, adminContactPhone
  } = displayData;

  return (
    <div className="my-rent-page-wrapper margin-top">
      <div className="my-rent-container container">
        <div className="page-title-container"><h1>My Rent</h1></div>
        <div className="rent-summary-card">
          <div className="tenancy-details">
            <p className="property-name">Staying at: <strong>{propertyName}</strong></p>
            <p className="room-info">Room: <strong>{roomInfo}</strong></p>
            <p className="monthly-rent">Monthly Rent: <strong>{currencySymbol}{monthlyRentAmount}</strong></p>
          </div>
          <hr className="divider" />
          <div className="next-payment-status">
            <p className="status-label">Rent for {nextMonthRent.monthName} {nextMonthRent.year}:</p>
            <span className={`status-badge status-${nextMonthRent.status.toLowerCase()}`}>{nextMonthRent.status}</span>
            {nextMonthRent.status === 'Due' && nextMonthRent.dueDate && (
              <p className="due-date-info">Please pay by {nextMonthRent.dueDate}.</p>
            )}
          </div>
        </div>
        <div className="payment-history-section">
          <div className="history-header">
            <h2>Payment History</h2>
            <div className="year-selector">
              <label htmlFor="yearSelect">Year:</label>
              <select id="yearSelect" value={selectedPaymentYearState} onChange={handleYearChange}>
                {availableYearsForDropdown.map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
            </div>
          </div>
          <div className="months-grid">
            {ALL_MONTHS.map(month => {
              const isPaid = paidMonthsForSelectedYearState.includes(month);
              return (
                <div key={month} className={`month-item ${isPaid ? 'paid' : 'not-paid'}`}>
                  {isPaid && (<span className="paid-icon">✓</span>)}
                  <span className="month-name">{month}</span>
                  <span className="month-status-text">{isPaid ? 'Paid' : 'Pending'}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="payment-info-contact-section">
          <div className="payment-instructions">
            <h3>How to Pay Your Rent</h3>
            <p>{paymentInstructions}</p>
          </div>
          <div className="contact-info">
            <h3>Questions About Your Rent?</h3>
            <p>Please contact us if you have any questions regarding your rent payments or tenancy.</p>
            <p className="contact-detail"><strong>Email:</strong> <a href={`mailto:${adminContactEmail}`}>{adminContactEmail}</a></p>
            <p className="contact-detail"><strong>Phone:</strong> <a href={`tel:${adminContactPhone}`}>{adminContactPhone}</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRentPage;