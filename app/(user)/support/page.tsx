"use client"

import './style.scss'
import SectionTitle from '../components/SectionTitle/SectionTitle'
import React, { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { databases, Query } from '@/lib/appwrite'

const APPWRITE_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const APPWRITE_PROFILES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID

// This component represents the Support Page content
const Page = () => { // Use PascalCase for component name
  const router = useRouter()
  const { currentUser, isLoading: authLoading } = useAuth()

  const [roomNumber, setRoomNumber] = useState('')
  const [issue, setIssue] = useState('')
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [isTenant, setIsTenant] = useState(false)
  const [tenantCheckLoading, setTenantCheckLoading] = useState(true)
  const [tenantError, setTenantError] = useState<string | null>(null)

  const stepsData = [
    {
      icon: '/images/support-step1.svg',
      iconAlt: 'Log Your Issue',
      title: 'Tell Us What’s Bugging You',
      text: ' A leaky tap or a tech hiccup - drop the details, we’ll do the rest.',
    },
    {
      icon: '/images/support-step2.svg',
      iconAlt: 'On Standby',
      title: 'We’re Watching This Space',
      text: ' Your issue is on our radar. We review it fast and keep it personal.',
    },
    {
      icon: '/images/support-step3.svg',
      iconAlt: 'Swift Resolution',
      title: 'Sorted, Not Shelved',
      text: 'We fix, follow up, and fill you in. Support that actually supports.',
    },
  ]

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.replace('/login')
    }
  }, [authLoading, currentUser, router])

  useEffect(() => {
    if (authLoading) {
      return
    }

    let isMounted = true

    const verifyTenantStatus = async () => {
      if (!currentUser) {
        if (isMounted) {
          setIsTenant(false)
          setTenantCheckLoading(false)
        }
        return
      }

      if (!APPWRITE_DATABASE_ID || !APPWRITE_PROFILES_COLLECTION_ID) {
        console.error('[Support] Missing Appwrite configuration')
        if (isMounted) {
          setTenantError('Support is temporarily unavailable. Please try again later.')
          setIsTenant(false)
          setTenantCheckLoading(false)
        }
        return
      }

      setTenantError(null)
      setTenantCheckLoading(true)

      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_PROFILES_COLLECTION_ID,
          [Query.equal('userId', currentUser.$id), Query.limit(1)]
        )

        const profileDoc = (response.documents[0] || null) as any
        const boarded = profileDoc?.isBoarded === true

        if (isMounted) {
          setIsTenant(boarded)
          setTenantCheckLoading(false)
        }
      } catch (error) {
        console.error('[Support] Failed to verify tenant status', error)
        if (isMounted) {
          setTenantError('Unable to verify your tenant status right now.')
          setIsTenant(false)
          setTenantCheckLoading(false)
        }
      }
    }

    verifyTenantStatus()

    return () => {
      isMounted = false
    }
  }, [authLoading, currentUser])

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleVideoEnd = () => {
      videoElement.pause()
    }

    videoElement.addEventListener('ended', handleVideoEnd)
    return () => {
      videoElement.removeEventListener('ended', handleVideoEnd)
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentUser || !isTenant || isSubmitting) {
      return
    }

    const trimmedRoomNumber = roomNumber.trim()
    const trimmedIssue = issue.trim()

    if (!trimmedRoomNumber || !trimmedIssue) {
      setSubmitError('Please provide both your room number and the issue details.')
      return
    }

    setSubmitError(null)
    setSubmitMessage(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: trimmedRoomNumber,
          issue: trimmedIssue,
          userId: currentUser.$id,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error((data as any)?.error || 'Failed to submit issue.')
      }

      setSubmitMessage('Thanks! Your issue has been logged. Our support team will reach out shortly.')
      setRoomNumber('')
      setIssue('')
      setAgreeToTerms(false)
    } catch (error) {
      console.error('[Support] Submission failed', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit issue.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isCheckingAccess = tenantCheckLoading || authLoading
  const shouldShowForm = !!currentUser && isTenant && !isCheckingAccess
  const submitDisabled = isSubmitting || !agreeToTerms || !roomNumber.trim() || !issue.trim()

  return (
    <div>
      {/* ============================== */}
      {/* START: Support Top Section     */}
      {/* ============================== */}
      <div className="topsection-container-main support-hero flex margin-bottom items-center justify-center">
        <div className="topsection-container container">
          <div className="content-container">
            <h1>Fix It with a Click</h1>
            <p>
              Room acting up? Faucet dripping? We’re already on our way (almost).
              Report your issue below, and we’ll keep the peace going strong.
            </p>
          </div>
          <div className="mascot-container">
            <img
              src="/images/mascot-support.gif"
              alt="Support Mascot"
              className="support-mascot"
            />
          </div>
        </div>
      </div>

      <div className="how-it-works-section-container flex items-center justify-center margin-bottom">
        <div className="how-it-works-section container">
          <SectionTitle
            title="No Stress, Just Steps!"
            subtext="Follow these easy steps to unlock rewards through our referral program and enrich your Hubode community experience!"
          />

          <div className="steps-cards-container">
            {stepsData.map((step, index) => (
              <div className="step-item" key={index}>
                <div className="icon-container">
                  <img src={step.icon} alt={step.iconAlt} />
                </div>
                <h5 className="step-title">{step.title}</h5>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="support-form-section-container flex items-center justify-center margin-bottom">
        <div className="support-form-section container">
          <SectionTitle
            title="Support Form"
            subtext="Please fill out the form below to report your issue, and our team will assist you promptly."
          />

          <div className="support-form-container">
            {isCheckingAccess && (
              <div className="support-form-status">
                <p>Hang tight—making sure you’re logged in and onboarded so we can assist you.</p>
              </div>
            )}

            {!isCheckingAccess && !shouldShowForm && (
              <div className="support-form-status">
                <p>
                  Support is reserved for active Hubode tenants. Once you’re onboarded, you’ll be able to
                  log issues directly from here.
                </p>
                {tenantError && <p className="support-form-message error">{tenantError}</p>}
              </div>
            )}

            {shouldShowForm && (
              <form className="support-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="support-room-no">Room no</label>
                    <input
                      type="text"
                      id="support-room-no"
                      name="roomNumber"
                      placeholder="Enter your room no"
                      value={roomNumber}
                      onChange={(event) => setRoomNumber(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="support-issue">Issue</label>
                    <textarea
                      id="support-issue"
                      name="issue"
                      placeholder="Describe your issue here"
                      rows={6}
                      value={issue}
                      onChange={(event) => setIssue(event.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="form-row form-row-terms">
                  <div className="form-group-checkbox">
                    <input
                      type="checkbox"
                      id="support-terms-agree"
                      name="supportTermsAgree"
                      checked={agreeToTerms}
                      onChange={(event) => setAgreeToTerms(event.target.checked)}
                      required
                    />
                    <label htmlFor="support-terms-agree">
                      I Agree to all{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">
                        Terms &amp; Conditions
                      </a>
                    </label>
                  </div>
                </div>

                {submitMessage && <p className="support-form-message success">{submitMessage}</p>}
                {submitError && <p className="support-form-message error">{submitError}</p>}

                <div className="form-row form-row-submit">
                  <button type="submit" className="submit-button" disabled={submitDisabled}>
                    {isSubmitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page
