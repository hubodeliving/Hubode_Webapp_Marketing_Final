"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import './waitlistPopup.scss';

type WaitlistMode = 'general' | 'property';

interface PropertyPopupContext {
  propertyName: string;
  propertyLocationShort: string;
  roomTypeOptions: Array<{ id: string; label: string }>;
  selectedRoomTypeId?: string | null;
}

interface WaitlistPopupProps {
  isVisible: boolean;
  onClose: () => void;
  mode?: WaitlistMode;
  source?: string;
  propertyContext?: PropertyPopupContext;
}

interface FormState {
  name: string;
  phone: string;
  occupation: string;
  comingFrom: string;
  propertyName: string;
  propertyLocation: string;
  roomType: string;
}

const initialFormState: FormState = {
  name: '',
  phone: '',
  occupation: '',
  comingFrom: '',
  propertyName: '',
  propertyLocation: '',
  roomType: '',
};

const WaitlistPopup: React.FC<WaitlistPopupProps> = ({
  isVisible,
  onClose,
  mode = 'general',
  source,
  propertyContext,
}) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSelectedRoomTypeRef = useRef<string | null>(null);
  const isPropertyMode = mode === 'property' && Boolean(propertyContext);

  const normalizedRoomTypeOptions = propertyContext?.roomTypeOptions ?? [];

  const defaultRoomTypeLabel = useMemo(() => {
    if (!isPropertyMode || !propertyContext) return '';
    if (propertyContext.selectedRoomTypeId) {
      const found = normalizedRoomTypeOptions.find(
        (opt) => opt.id === propertyContext.selectedRoomTypeId
      );
      if (found) return found.label;
    }
    return normalizedRoomTypeOptions[0]?.label || '';
  }, [isPropertyMode, normalizedRoomTypeOptions, propertyContext]);

  useEffect(() => {
    if (!isVisible) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) {
      setIsClosing(false);
      setFormData((prev) => ({
        ...prev,
        name: '',
        phone: '',
        occupation: '',
        comingFrom: '',
      }));
      setErrorMessage(null);
      setSuccessMessage(null);
    }
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !isPropertyMode || !propertyContext) return;
    setFormData((prev) => {
      const selectedId = propertyContext.selectedRoomTypeId ?? null;
      const selectedLabel = defaultRoomTypeLabel;
      const shouldSyncRoomType =
        !prev.roomType ||
        (selectedId && lastSelectedRoomTypeRef.current !== selectedId);

      lastSelectedRoomTypeRef.current = selectedId;

      return {
        ...prev,
        propertyName: propertyContext.propertyName,
        propertyLocation: propertyContext.propertyLocationShort,
        roomType: shouldSyncRoomType ? selectedLabel : (prev.roomType || selectedLabel),
      };
    });
  }, [isVisible, isPropertyMode, propertyContext, defaultRoomTypeLabel]);

  if (!isVisible) {
    return null;
  }

  const handleDismiss = () => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
    }, 320);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.occupation.trim() || !formData.comingFrom.trim()) {
      setErrorMessage('Please fill out every field to join the waitlist.');
      setSuccessMessage(null);
      return;
    }
    if (isPropertyMode && !formData.roomType.trim()) {
      setErrorMessage('Please choose a room type.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const submissionSource = source || (isPropertyMode ? 'room-booking' : 'waitlist-popup');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: submissionSource,
        }),
      });

      if (!response.ok) {
        let message = 'Unable to submit right now.';
        try {
          const data = await response.json();
          if (data?.error) {
            message = data.error;
          }
        } catch (err) {
          // ignore parse errors
        }
        throw new Error(message);
      }

      setFormData((prev) => ({
        ...prev,
        name: '',
        phone: '',
        occupation: '',
        comingFrom: '',
      }));
      setSuccessMessage("Thanks! You're on the list - we'll be in touch soon.");
    } catch (error) {
      console.error('Waitlist submission failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overlayClassName = `waitlist-modal-overlay${isClosing ? ' closing' : ''}`;
  const cardClassName = `waitlist-modal-card${isClosing ? ' closing' : ''}`;

  const eyebrowCopy = isPropertyMode && propertyContext
    ? `You're eyeing ${propertyContext.propertyLocationShort}`
    : 'Calicut, get ready! Hubode is coming soon.';
  const titleCopy = isPropertyMode ? 'Join the Waitlist' : 'Find Your New Home';
  const subtextCopy = isPropertyMode
    ? 'Drop your info to reserve a spot for this room type. We will reach out as soon as it opens up.'
    : 'Be the first to experience a new standard of co-living. Sign up for exclusive early access, special launch offers, and updates.';

  return (
    <div className={overlayClassName} role="dialog" aria-modal="true" aria-labelledby="waitlist-title" aria-describedby="waitlist-subtext">
      <div className={cardClassName}>
        <button type="button" className="waitlist-close-button" onClick={handleDismiss} aria-label="Close waitlist popup">
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="waitlist-modal-content">
          <p className="waitlist-eyebrow">{eyebrowCopy}</p>
          <h3 id="waitlist-title" className="waitlist-title">{titleCopy}</h3>
          <p id="waitlist-subtext" className="waitlist-subtext">
            {subtextCopy}
          </p>

          <form className="waitlist-form" onSubmit={handleFormSubmit}>
            {isPropertyMode && propertyContext && (
              <>
                <div className="waitlist-form-row full-width">
                  <label htmlFor="waitlist-property">Property & Location</label>
                  <input
                    id="waitlist-property"
                    name="propertySummary"
                    type="text"
                    value={`${propertyContext.propertyName}${propertyContext.propertyLocationShort ? ` • ${propertyContext.propertyLocationShort}` : ''}`}
                    readOnly
                    disabled
                  />
                </div>

                <div className="waitlist-form-row">
                  <label htmlFor="waitlist-room-type">Room Type</label>
                  <select
                    id="waitlist-room-type"
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    disabled={isSubmitting || normalizedRoomTypeOptions.length === 0}
                  >
                    <option value="" disabled>Select room type</option>
                    {normalizedRoomTypeOptions.map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="waitlist-form-row">
              <label htmlFor="waitlist-name">Name</label>
              <input
                id="waitlist-name"
                name="name"
                type="text"
                placeholder="Enter your First Name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="given-name"
              />
            </div>

            <div className="waitlist-form-row">
              <label htmlFor="waitlist-phone">Phone</label>
              <input
                id="waitlist-phone"
                name="phone"
                type="tel"
                placeholder="Enter your Phone Number"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="tel"
              />
            </div>

            <div className="waitlist-form-row">
              <label htmlFor="waitlist-occupation">Pursuit</label>
              <select
                id="waitlist-occupation"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                disabled={isSubmitting}
              >
                <option value="" disabled>Select your pursuit</option>
                <option value="Student">Student</option>
                <option value="Working Professional">Working Professional</option>
                <option value="Exploring">Exploring</option>
              </select>
            </div>

            <div className="waitlist-form-row">
              <label htmlFor="waitlist-coming-from">Coming From</label>
              <input
                id="waitlist-coming-from"
                name="comingFrom"
                type="text"
                placeholder="Enter your City"
                value={formData.comingFrom}
                onChange={handleInputChange}
                disabled={isSubmitting}
                autoComplete="address-level2"
              />
            </div>

            {errorMessage && <p className="waitlist-feedback error">{errorMessage}</p>}
            {successMessage && <p className="waitlist-feedback success">{successMessage}</p>}

            <div className="waitlist-actions">
              <button type="submit" className="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
              <button type="button" className="secondary" onClick={handleDismiss}>
                Continue to Site
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPopup;
