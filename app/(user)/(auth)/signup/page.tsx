// File: app/(user)/(auth)/signup/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { account, AppwriteException } from '@/lib/appwrite'; // account needed for Google flow updates
import './style.scss';

const GoogleLogo = () => (  /* ... SVG ... */ <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6402 9.20455C17.6402 8.56818 17.582 7.94091 17.4775 7.33636H9V10.8318H13.8438C13.6365 11.9705 13.0001 12.9318 12.0411 13.5682V15.8386H14.9558C16.6706 14.2523 17.6402 11.9318 17.6402 9.20455Z" fill="#4285F4"/><path d="M9.00001 18C11.4318 18 13.4773 17.1955 14.9546 15.8386L12.0409 13.5682C11.2364 14.1114 10.2273 14.4545 9.00001 14.4545C6.65228 14.4545 4.67046 12.9114 3.96364 10.7159H0.954545V13.0523C2.43182 15.9705 5.48182 18 9.00001 18Z" fill="#34A853"/><path d="M3.96364 10.7159C3.78636 10.1727 3.68182 9.59091 3.68182 9C3.68182 8.40909 3.78636 7.82727 3.96364 7.28409V4.94773H0.954545C0.340909 6.17727 0 7.55227 0 9C0 10.4477 0.340909 11.8227 0.954545 13.0523L3.96364 10.7159Z" fill="#FBBC05"/><path d="M9.00001 3.54545C10.3091 3.54545 11.5091 4.01364 12.4182 4.88182L15.0227 2.33864C13.4773 0.886364 11.4318 0 9.00001 0C5.48182 0 2.43182 2.02955 0.954545 4.94773L3.96364 7.28409C4.67046 5.08864 6.65228 3.54545 9.00001 3.54545Z" fill="#EA4335"/></svg>);

export default function SignupPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName]   = useState('');
    const [email, setEmail]         = useState('');
    const [phone, setPhone]         = useState('');
    const [password, setPassword]   = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeTerms, setAgreeTerms]           = useState(false);
    const [error, setError]         = useState<string | null>(null);
    const [isGoogleSignupFlow, setIsGoogleSignupFlow] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);

    const { initiateGoogleAuth, isLoading: authContextIsLoading, currentUser, signup: contextSignup, updateUserProfileAfterGoogleOrFirstLogin } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    /* ── determines whether we’re in Google-signup mode ───────────── */
    useEffect(() => {
        const googleFlag   = searchParams.get("isGoogleSignup") === "true";
        const googleLoaded = currentUser && !authContextIsLoading;

        setIsGoogleSignupFlow(googleFlag);

        if (googleFlag && googleLoaded) {
            if (currentUser!.prefs?.completedProfile) {
                router.push("/");
                return;
            }
            const [gFirst = "", ...rest] = currentUser!.name.split(" ");
            setFirstName(gFirst);
            setLastName(rest.join(" "));
            setEmail(currentUser!.email);
        }

        if (!googleFlag && googleLoaded) router.push("/");
    }, [currentUser, authContextIsLoading, searchParams, router]);

    const handleSignupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setPageLoading(true);

        if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
            setError("Please fill in all personal details."); setPageLoading(false); return;
        }
        if (!isGoogleSignupFlow && (!password || !confirmPassword)) {
            setError("Please enter and confirm your password."); setPageLoading(false); return;
        }
        if (!isGoogleSignupFlow && password !== confirmPassword) {
            setError("Passwords do not match."); setPageLoading(false); return;
        }
        if (!agreeTerms) {
            setError("You must agree to the Terms & Conditions."); setPageLoading(false); return;
        }

        try {
            const fullName = `${firstName} ${lastName}`.trim();

            // Google flow: just finish profile or go home
            if (isGoogleSignupFlow) {
                await updateUserProfileAfterGoogleOrFirstLogin({ name: fullName, phone });
                router.push("/");
                return;
            }

            // Classic email + password
            const { userId, email: registeredEmail } = await contextSignup(
                fullName,
                email,
                password,
                phone
            );

            if (typeof window !== "undefined") {
                localStorage.setItem("signupUserId", userId);
            }

            // IMPORTANT: redirect flag so /verify-otp uses Appwrite email verification
            router.replace(
                `/verify-otp?email=${encodeURIComponent(registeredEmail)}&userId=${userId}&redirect=signup-verify`
            );
        } catch (e) {
            if (e instanceof AppwriteException) {
                const generic =
                    "There was an error processing your request. Please check the inputs and try again.";
                if (e.message === generic) {
                    setError("An account with that email or phone already exists.");
                } else {
                    setError(e.message);
                }
            } else {
                setError("Unexpected error. Please try again.");
            }
        } finally {
            setPageLoading(false);
        }
    };

    /* ── kicks off Google OAuth and comes *back* to this page ──────── */
    const handleGoogleSignupFlow = () => {
        setError(null);
        const success = `${window.location.origin}/signup?isGoogleSignup=true`;
        const failure = `${window.location.origin}/signup?oauth=failed`;
        account.createOAuth2Session("google", success, failure)
            .catch(() => setError("Google sign-in failed. Please try again."));
    };

    const currentOverallLoading = pageLoading || authContextIsLoading;

    return (
        <div className="login-main-section-container flex items-center justify-center margin-bottom margin-top">
            <div className="login-main-section container">
                <div className="left-section">
                    <h1>Create Your Account</h1>
                    <div className="form-container">
                        <form onSubmit={handleSignupSubmit} noValidate>
                            <div className="form-row-split">
                                <div className="form-group">
                                    <label htmlFor="firstName">First Name</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        placeholder="Enter your First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        disabled={currentOverallLoading || (isGoogleSignupFlow && !!searchParams.get('firstName'))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        placeholder="Enter your Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        disabled={currentOverallLoading || (isGoogleSignupFlow && !!searchParams.get('lastName'))}
                                    />
                                </div>
                            </div>

                            {!isGoogleSignupFlow && (
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="Enter your Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={currentOverallLoading}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="phone">Phone</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="Enter your Phone Number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    disabled={currentOverallLoading}
                                />
                            </div>

                            {!isGoogleSignupFlow && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="signupPassword">Password</label>
                                        <input
                                            type="password"
                                            id="signupPassword"
                                            name="password"
                                            placeholder="Enter your Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={currentOverallLoading}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            placeholder="Confirm your Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            disabled={currentOverallLoading}
                                        />
                                    </div>
                                </>
                            )}

                            <p className="auth-alternate-link">
                                Already Have an Account?{' '}
                                <Link href="/login" legacyBehavior><a>Login</a></Link>
                            </p>

                            <div className="form-options terms-option">
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="agreeTerms"
                                        name="agreeTerms"
                                        checked={agreeTerms}
                                        onChange={(e) => setAgreeTerms(e.target.checked)}
                                        disabled={currentOverallLoading}
                                    />
                                    <label htmlFor="agreeTerms">
                                        I Agree to all{' '}
                                        <Link href="/terms-and-conditions" legacyBehavior>
                                            <a className="terms-conditions-link" target="_blank" rel="noopener noreferrer">
                                                Terms & Conditions
                                            </a>
                                        </Link>
                                    </label>
                                </div>
                            </div>

                            {error && <p className="form-feedback error" role="alert">{error}</p>}

                            <button
                                type="submit"
                                className="btn btn-submit-auth"
                                disabled={currentOverallLoading}
                            >
                                {pageLoading
                                    ? "Processing..."
                                    : isGoogleSignupFlow
                                        ? "Complete Sign Up"
                                        : "Sign Up"}
                            </button>
                        </form>

                        {!isGoogleSignupFlow && (
                            <>
                                <div className="social-login-divider"><span>Or</span></div>
                                <button
                                    type="button"
                                    className="btn btn-google-auth"
                                    onClick={handleGoogleSignupFlow}
                                    disabled={authContextIsLoading}
                                >
                                    <GoogleLogo />
                                    {authContextIsLoading ? 'Processing...' : 'Sign up with Google'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="right-section">
                    <img src="/images/signup-image.png" alt="Person studying" className="login-page-image" />
                </div>
            </div>
        </div>
    );
}
