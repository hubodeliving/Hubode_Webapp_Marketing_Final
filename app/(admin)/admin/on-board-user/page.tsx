// File: app/(admin)/on-board-user/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { client as sanityClient } from '@/lib/sanity.client'; // Your existing client-side Sanity client
import groq from 'groq';
import Image from 'next/image'; // Make sure Image is imported if used in JSX (e.g. for icons)
import './style.scss';

// --- INTERFACES ---
interface OnboardingUser {
  id: string; // This will be the Appwrite Auth User ID
  name: string;
}

interface SanityProperty {
  _id: string;
  propertyName: string;
  roomTypes: SanityOccupancyGroup[];
}

interface SanityOccupancyGroup {
  _key: string;
  occupancyName: string;
  tiers: SanityRoomTier[];
}

interface SanityRoomTier {
  _key: string;
  tierName: string;
  pricePerMonth: number;
  bedsLeft: number;
}

interface OnboardingFormData {
  selectedPropertyId: string;
  selectedOccupancyGroupKey: string;
  selectedRoomTierKey: string;
  rent: string;
  // moveInDate?: string; // Example for later
}

// --- SANITY QUERY ---
const propertiesQuery = groq`
  *[_type == "property" && defined(slug.current) && published == true] | order(propertyName asc) {
    _id,
    propertyName,
    roomTypes[]{
      _key,
      occupancyName,
      tiers[]{
        _key,
        tierName,
        pricePerMonth,
        bedsLeft
      }
    }
  }
`;

export default function OnBoardUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [onboardingUser, setOnboardingUser] = useState<OnboardingUser | null>(null);
  const [allProperties, setAllProperties] = useState<SanityProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<SanityProperty | null>(null);
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    selectedPropertyId: '',
    selectedOccupancyGroupKey: '',
    selectedRoomTierKey: '',
    rent: 'N/A',
  });

  const [isLoadingSanityData, setIsLoadingSanityData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    if (userId && name) {
      setOnboardingUser({ id: userId, name: decodeURIComponent(name) });
    } else {
      setError("User ID or Name missing from URL. Cannot proceed.");
      // Consider redirecting if essential params are missing and not just showing an error
      // router.replace('/admin/all-users'); 
    }
  }, [searchParams, router]); // Added router to dependency array if used inside

  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoadingSanityData(true);
      setError(null); // Reset error before fetching
      try {
        const propertiesData = await sanityClient.fetch<SanityProperty[]>(propertiesQuery);
        setAllProperties(propertiesData || []);
        // No pre-selection logic here, user must select
      } catch (err) {
        console.error("Failed to fetch Sanity properties:", err);
        setError("Could not load property data from CMS. Please try refreshing.");
      } finally {
        setIsLoadingSanityData(false);
      }
    };
    fetchProperties();
  }, []); // Runs once on mount

  const availableOccupancyGroups = useMemo(() => {
    return selectedProperty?.roomTypes || [];
  }, [selectedProperty]);

  const availableRoomTiers = useMemo(() => {
    if (!selectedProperty || !formData.selectedOccupancyGroupKey) return [];
    const group = selectedProperty.roomTypes.find(g => g._key === formData.selectedOccupancyGroupKey);
    // Ensure we only show tiers with beds left. If a tier is selected then bedsLeft becomes 0 by another user, it should become disabled.
    return group?.tiers.filter(tier => tier.bedsLeft > 0) || []; 
  }, [selectedProperty, formData.selectedOccupancyGroupKey]);

  useEffect(() => { // Updates rent when selections change
    if (selectedProperty && formData.selectedOccupancyGroupKey && formData.selectedRoomTierKey) {
      const group = selectedProperty.roomTypes.find(g => g._key === formData.selectedOccupancyGroupKey);
      const tier = group?.tiers.find(t => t._key === formData.selectedRoomTierKey);
      
      if (tier && tier.bedsLeft > 0) { // Check bedsLeft again before setting rent
        setFormData(prev => ({ ...prev, rent: tier.pricePerMonth.toString() }));
      } else if (tier && tier.bedsLeft <= 0) {
        setFormData(prev => ({ ...prev, rent: 'N/A', selectedRoomTierKey: '' })); // Tier selected is now unavailable
        setError("Selected room tier just became unavailable (0 beds left). Please select another.");
      } else {
        setFormData(prev => ({ ...prev, rent: 'N/A' }));
      }
    } else {
      setFormData(prev => ({ ...prev, rent: 'N/A' }));
    }
  }, [selectedProperty, formData.selectedOccupancyGroupKey, formData.selectedRoomTierKey]);

  const handlePropertyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const propertyId = e.target.value;
    const newSelectedProperty = allProperties.find(p => p._id === propertyId) || null;
    setSelectedProperty(newSelectedProperty);
    setFormData({
      selectedPropertyId: propertyId,
      selectedOccupancyGroupKey: '',
      selectedRoomTierKey: '',
      rent: 'N/A',
    });
    setError(null);
  }, [allProperties]);

  const handleOccupancyGroupChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupKey = e.target.value;
    setFormData(prev => ({
      ...prev,
      selectedOccupancyGroupKey: groupKey,
      selectedRoomTierKey: '',
      rent: 'N/A',
    }));
    setError(null);
  }, []);
  
  const handleRoomTierChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const tierKey = e.target.value;
    // Check if selected tier still has beds before updating the state
    const group = selectedProperty?.roomTypes.find(g => g._key === formData.selectedOccupancyGroupKey);
    const tier = group?.tiers.find(t => t._key === tierKey);
    if (tier && tier.bedsLeft <= 0) {
        setError(`Room Tier "${tier.tierName}" has no beds left. Please choose another.`);
        setFormData(prev => ({ ...prev, selectedRoomTierKey: '', rent: 'N/A'})); // Clear selection
        return;
    }
    setFormData(prev => ({ ...prev, selectedRoomTierKey: tierKey }));
    setError(null);
  }, [selectedProperty, formData.selectedOccupancyGroupKey]);


  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!onboardingUser) {
        setError("User information is missing. Cannot save."); return;
    }
    if (!formData.selectedPropertyId || !formData.selectedOccupancyGroupKey || !formData.selectedRoomTierKey || formData.rent === 'N/A' || !formData.rent) {
      setError("All property, room type, and room tier selections are required, and rent must be determined."); return;
    }
    const rentAmount = parseFloat(formData.rent.replace(/,/g, ''));
    if (isNaN(rentAmount) || rentAmount <= 0) {
        setError("A valid rent amount must be determined before saving."); return;
    }

    const currentProperty = allProperties.find(p => p._id === formData.selectedPropertyId);
    const currentOccupancyGroup = currentProperty?.roomTypes.find(g => g._key === formData.selectedOccupancyGroupKey);
    const currentRoomTier = currentOccupancyGroup?.tiers.find(t => t._key === formData.selectedRoomTierKey);

    if (!currentProperty || !currentOccupancyGroup || !currentRoomTier) {
        setError("Could not find all selected property details. Please re-select."); return;
    }
    if (currentRoomTier.bedsLeft <= 0) {
        setError(`Selected tier "${currentRoomTier.tierName}" has no beds left. Please refresh or select another.`); return;
    }

    setIsSaving(true);
    const apiPayload = {
        appwriteAuthUserId: onboardingUser.id,
        sanityPropertyId: formData.selectedPropertyId,
        sanityPropertyName: currentProperty.propertyName,
        sanityOccupancyGroupKey: formData.selectedOccupancyGroupKey,
        occupancyName: currentOccupancyGroup.occupancyName,
        sanityRoomTierKey: formData.selectedRoomTierKey,
        tierName: currentRoomTier.tierName,
        rentAmount: rentAmount,
        currency: "INR",
    };

    try {
      console.log("[OnBoardUserPage] Sending payload to API:", apiPayload);
      const response = await fetch('/api/admin/on-board-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || `Server error ${response.status}`);
      
      alert("User onboarded successfully!");
      router.push(`/admin/all-users/${onboardingUser.id}`);
    } catch (apiError: any) {
      console.error("Error saving onboarding details:", apiError);
      setError(`Failed to save: ${apiError.message || "Please try again."}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!onboardingUser && !error) { // Show loading if user info is not yet set AND no critical error
    return <div className="loading-state">Loading user information...</div>;
  }
  if (error && !onboardingUser) { // If there was an error fetching user from params
    return <div className="error-state">{error}</div>;
  }
  // After user is set, then check Sanity data loading
  if (isLoadingSanityData) {
    return <div className="loading-state">Loading property details...</div>;
  }
  // If there was an error loading Sanity data AFTER user info was confirmed
  if (error && onboardingUser) { 
    // Display error but still show user info and allow retry or inform user
  }


  const initial = onboardingUser?.name?.charAt(0).toUpperCase() || "U"; // Fallback for initial

  return (
    <div className="onboard-user-page">
      <h1 className="page-title">On-Board User</h1>
      {onboardingUser && ( // Only render the main content if onboardingUser is loaded
        <div className="onboard-content-wrapper">
          <div className="user-header-section">
            <div className="profile-icon">{initial}</div>
            <div className="user-name-display">
              <h5>{onboardingUser.name}</h5>
              <p className="user-id-display">User ID: {onboardingUser.id}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="onboard-form">
            <h2>Select Staying Property Details</h2>
            <div className="form-group">
              <label htmlFor="property">Property</label>
              <select id="property" name="selectedPropertyId" value={formData.selectedPropertyId} onChange={handlePropertyChange} disabled={isSaving || allProperties.length === 0} required>
                  <option value="" disabled={!!formData.selectedPropertyId}>Select Property</option>
                  {allProperties.map(prop => <option key={prop._id} value={prop._id}>{prop.propertyName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="roomType">Room Type (Occupancy)</label>
              <select id="roomType" name="selectedOccupancyGroupKey" value={formData.selectedOccupancyGroupKey} onChange={handleOccupancyGroupChange} disabled={isSaving || !selectedProperty || availableOccupancyGroups.length === 0} required>
                  <option value="" disabled={!!formData.selectedOccupancyGroupKey}>Select Room Type</option>
                  {availableOccupancyGroups.map(group => <option key={group._key} value={group._key}>{group.occupancyName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="roomTier">Room Tier</label>
              <select id="roomTier" name="selectedRoomTierKey" value={formData.selectedRoomTierKey} onChange={handleRoomTierChange} disabled={isSaving || !formData.selectedOccupancyGroupKey || availableRoomTiers.length === 0} required>
                  <option value="" disabled={!!formData.selectedRoomTierKey}>Select Room Tier</option>
                  {availableRoomTiers.map(tier => (
                      <option key={tier._key} value={tier._key} disabled={tier.bedsLeft <= 0} title={tier.bedsLeft <=0 ? "No beds available" : ""}>
                          {tier.tierName} ({tier.bedsLeft} bed{tier.bedsLeft !== 1 ? 's' : ''} left)
                      </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="rentDisplay">Calculated Rent</label>
              <div className="rent-display-group" id="rentDisplay">
                  <span className="currency-symbol bold">₹</span>
                  <span className="rent-amount bold large">
                      {formData.rent !== 'N/A' && formData.rent ? parseFloat(formData.rent).toLocaleString('en-IN') : 'N/A'}
                  </span>
                  <span className="rent-suffix">per month</span>
              </div>
            </div>
            {/* Display general error related to form submission or data loading */}
            {error && <p className="form-feedback error" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="save-button" 
                disabled={
                  isSaving || 
                  formData.rent === 'N/A' || 
                  !formData.rent || 
                  !formData.selectedRoomTierKey || 
                  (availableRoomTiers.find(t=>t._key === formData.selectedRoomTierKey)?.bedsLeft || 0) <= 0
                }>
                {isSaving ? 'Saving...' : 'Save & On-Board'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* If !onboardingUser and there was an error setting it up initially */}
      {!onboardingUser && error && (
         <div className="error-state" style={{textAlign: 'center', padding: '2rem', fontFamily: 'sans-serif'}}>
            <p>{error}</p>
            <button onClick={() => router.back()} style={{padding: '0.5rem 1rem', marginTop: '1rem'}}>Go Back</button>
        </div>
      )}
    </div>
  );
}