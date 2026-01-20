// File: app/(user)/(auth)/login/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { useAuth } from '@/context/AuthContext'; // Adjust path
import { AppwriteException } from '@/lib/appwrite'; // Adjust path
import './style.scss';

const GoogleLogo = () => ( /* ... SVG ... */ <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.6402 9.20455C17.6402 8.56818 17.582 7.94091 17.4775 7.33636H9V10.8318H13.8438C13.6365 11.9705 13.0001 12.9318 12.0411 13.5682V15.8386H14.9558C16.6706 14.2523 17.6402 11.9318 17.6402 9.20455Z" fill="#4285F4"/><path d="M9.00001 18C11.4318 18 13.4773 17.1955 14.9546 15.8386L12.0409 13.5682C11.2364 14.1114 10.2273 14.4545 9.00001 14.4545C6.65228 14.4545 4.67046 12.9114 3.96364 10.7159H0.954545V13.0523C2.43182 15.9705 5.48182 18 9.00001 18Z" fill="#34A853"/><path d="M3.96364 10.7159C3.78636 10.1727 3.68182 9.59091 3.68182 9C3.68182 8.40909 3.78636 7.82727 3.96364 7.28409V4.94773H0.954545C0.340909 6.17727 0 7.55227 0 9C0 10.4477 0.340909 11.8227 0.954545 13.0523L3.96364 10.7159Z" fill="#FBBC05"/><path d="M9.00001 3.54545C10.3091 3.54545 11.5091 4.01364 12.4182 4.88182L15.0227 2.33864C13.4773 0.886364 11.4318 0 9.00001 0C5.48182 0 2.43182 2.02955 0.954545 4.94773L3.96364 7.28409C4.67046 5.08864 6.65228 3.54545 9.00001 3.54545Z" fill="#EA4335"/></svg>);

export default function LoginPage() {
    const [emailOrPhone, setEmailOrPhone] = useState(''); // Assuming email for Appwrite login
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false); // Appwrite SDK handles session, 'remember me' is implicit
    const [error, setError] = useState<string | null>(null);
    
    const { login, initiateGoogleAuth, isLoading: authLoading, currentUser, checkUserSession } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [oauthProcessing, setOauthProcessing] = useState(false);

    useEffect(() => {
        /* ① new Google session → pull user once */
        if (searchParams.get("oauth") === "success" && !oauthProcessing) {
          setOauthProcessing(true);
          checkUserSession();
          return;
        }

        if (oauthProcessing && currentUser) {
          router.replace("/");
          return;
        }
      
        /* ② fully-onboarded & actively logged-in?  leave /login */
        if (
          currentUser &&
          currentUser.prefs?.completedProfile &&
          currentUser.prefs?.phone?.length &&
          searchParams.get("oauth") !== "success"        // not in Google flow
        ) {
          router.replace("/");
        }
      
        /* ③ surface any OAuth error */
        const oauthError = searchParams.get("error");
        if (oauthError) setError(decodeURIComponent(oauthError));
      }, [currentUser, searchParams, oauthProcessing, checkUserSession, router]);
    
      /* ───────── RENDER ───────── */
      const busy = oauthProcessing || authLoading;  // single flag
    
      if (busy) {
        return (
          <div className="flex h-screen items-center justify-center">
            <p>Signing you in…</p>
          </div>
        );
      }



    


    /* ----------------------------------------------- */
/*  PASSWORD + OTP FLOW                            */
/* ----------------------------------------------- */
/* ----------------------------------------------- */
/*  PASSWORD + OTP FLOW (fixed)                    */
/* ----------------------------------------------- */
const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError(null);

  if (!emailOrPhone.trim() || !password.trim()) {
    setError("Please fill in both fields.");
    return;
  }

  try {
    // 1) AuthContext.login does: password session → trigger OTP function → delete session
    const { userId, email } = await login(emailOrPhone, password);

    // 2) Go straight to OTP page using the returned values
    router.replace(
      `/verify-otp?email=${encodeURIComponent(email)}&userId=${userId}`
    );
  } catch (e: any) {
    // Appwrite throws 401 for *any* bad credentials. Don’t assume Google-only.
    if (e instanceof AppwriteException && e.code === 401) {
      setError("Invalid email or password.");
    } else if (e instanceof AppwriteException) {
      setError(e.message || "Login failed. Please try again.");
    } else {
      setError("Unexpected error. Please try again.");
      console.error(e);
    }
  }
};


    const handleGoogleLogin = () => {
        setError(null);
        initiateGoogleAuth();
    };

    return (
        <div className="login-main-section-container flex items-center justify-center margin-bottom margin-top">
            <div className="login-main-section container">
                <div className="left-section">
                    <h1>Welcome Back!</h1>
                    <div className="form-container">
                        <form onSubmit={handleLoginSubmit} noValidate>
                            <div className="form-group">
                                <label htmlFor="emailOrPhone">Email</label> {/* Changed to Email */}
                                <input type="email" id="emailOrPhone" name="email" placeholder="Enter your Email"
                                    value={emailOrPhone} onChange={(e) => { setEmailOrPhone(e.target.value); if (error) setError(null); }}
                                    required disabled={authLoading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input type="password" id="password" name="password" placeholder="Enter your Password"
                                    value={password} onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
                                    required disabled={authLoading} />
                            </div>
                            <div className="form-options">
                                <div className="checkbox-group">
                                    <input type="checkbox" id="rememberMe" name="rememberMe"
                                        checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                                        disabled={authLoading} />
                                    <label htmlFor="rememberMe">Remember me</label>
                                </div>
                                <Link href="/forgot-password" legacyBehavior>
                                    <a className="forgot-password-link">Forgot Password?</a>
                                </Link>
                            </div>
                            <p className="signup-link-inline"> {/* Renamed from auth-alternate-link for clarity */}
                                Don't Have an Account?{' '}
                                <Link href="/signup" legacyBehavior><a>Sign Up</a></Link>
                            </p>
                            {error && <p className="form-feedback error" role="alert">{error}</p>}
                            <button type="submit" className="btn btn-login" disabled={authLoading}>
                                {authLoading ? 'Logging In...' : 'Log In'}
                            </button>
                        </form>
                        <div className="social-login-divider"><span>Or</span></div>
                        <button type="button" className="btn btn-google-login" onClick={handleGoogleLogin} disabled={authLoading}>
                            <GoogleLogo />
                            {authLoading ? 'Processing...' : 'Log In with Google'}
                        </button>
                    </div>
                </div>
                <div className="right-section">
                    <img src="/images/login-image.png" alt="People collaborating" className="login-page-image" />
                </div>
            </div>
        </div>
    );
}