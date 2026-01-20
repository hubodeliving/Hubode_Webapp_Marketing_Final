"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import "./style.scss";

export default function SetPasswordPage() {
  /* ─── State ───────────────────────────────────────────────────────── */
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  const { resetPasswordWithOtp, isLoading: authBusy } = useAuth();
  const router       = useRouter();
  const params       = useSearchParams();

  /* ─── Query-params ─────────────────────────────────────────────────── */
  const userId = params.get("userId") || "";
  const secret = params.get("secret") || "";

  /* ─── Redirect if link is invalid ─────────────────────────────────── */
  if (!userId || !secret) {
    return (
      <div className="login-main-section-container flex items-center justify-center">
        <p className="error">Invalid or expired password-reset link.</p>
      </div>
    );
  }

  /* ─── Form submit ──────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (newPw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordWithOtp(userId, secret, newPw, confirmPw);
      setSuccess("Password updated! Redirecting to login…");
      setTimeout(() => router.replace("/login"), 1800);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    }
  };

  /* ─── View ────────────────────────────────────────────────────────── */
  return (
    <div className="login-main-section-container flex items-center justify-center margin-bottom margin-top">
      <div className="login-main-section container single-column">
        <div className="left-section">
          <h1>Set New Password</h1>
          <div className="form-container">
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="newPw">New Password</label>
                <input
                  type="password"
                  id="newPw"
                  name="newPw"
                  placeholder="Enter your new password"
                  value={newPw}
                  onChange={(e) => {
                    setNewPw(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={authBusy}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPw">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPw"
                  name="confirmPw"
                  placeholder="Re-enter your new password"
                  value={confirmPw}
                  onChange={(e) => {
                    setConfirmPw(e.target.value);
                    if (error) setError(null);
                  }}
                  required
                  disabled={authBusy}
                />
              </div>

              {error && <p className="form-feedback error">{error}</p>}
              {success && <p className="form-feedback success">{success}</p>}

              <button
                type="submit"
                className="btn btn-login"
                disabled={authBusy}
              >
                {authBusy ? "Saving…" : "Save Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
