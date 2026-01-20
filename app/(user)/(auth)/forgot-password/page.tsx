// File: app/(user)/(auth)/forgot-password/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { AppwriteException } from "@/lib/appwrite";
import "./style.scss";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [sent, setSent]       = useState(false);

  // pull in only the recovery helper
  const { sendPasswordRecovery, isLoading: authBusy } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter a valid e-mail.");
      return;
    }
    try {
      await sendPasswordRecovery(email.trim());
      setSent(true);
    } catch (err: any) {
      if (err instanceof AppwriteException) {
        setError(err.message);
      } else {
        setError("Failed to send reset link. Please try again.");
      }
    }
  };

  return (
    <div className="login-main-section-container flex items-center justify-center">
      <div className="login-main-section container single-column">
        <div className="left-section">
          <h1>Forgot Password</h1>
          <div className="form-container">
            {sent ? (
              <p className="form-feedback success">
                If an account exists for <strong>{email}</strong>, you’ll receive a password-reset link shortly.
              </p>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter your registered e-mail"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    disabled={authBusy}
                  />
                </div>

                {error && <p className="form-feedback error">{error}</p>}

                <button
                  type="submit"
                  className="btn btn-login"
                  disabled={authBusy}
                >
                  {authBusy ? "Sending reset link…" : "Send Reset Link"}
                </button>

                <p className="signup-link-inline mt-2">
                  Remembered? <Link href="/login">Back to log in</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
