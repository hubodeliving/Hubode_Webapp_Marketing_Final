// File: app/(user)/profile/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import "./style.scss";
import {functions} from "@/lib/appwrite"

export default function EditProfilePage() {
    const {
        currentUser,
        isLoading,
        sendEmailChangeOtp,              // <-- Add this for email change OTP
        updateUserProfileAfterGoogleOrFirstLogin,
    } = useAuth();
    const router = useRouter();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [emailState, setEmailState] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ---- AUTH GUARD / SEED DATA ----
    useEffect(() => {
        if (!isLoading && !currentUser) {
            router.replace("/login");
        }
    }, [isLoading, currentUser, router]);

    useEffect(() => {
        if (!currentUser) return;
        const [f, ...rest] = (currentUser.name || "").split(" ");
        setFirstName(f);
        setLastName(rest.join(" "));
        setPhone(currentUser.prefs?.phone || "");
        setEmailState(currentUser.email);
    }, [currentUser]);

    if (isLoading || !currentUser) {
        return null;
    }

    const newFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const newEmail = emailState.trim();
    const emailChanged = newEmail !== currentUser.email;
    const actionLabel = emailChanged ? "Save Email" : "Save";

    const EMAIL_CHANGE_FN_ID =
        process.env.NEXT_PUBLIC_FN_ID_INITIATE_EMAIL_CHANGE || "";

// optionally, in dev, log once to confirm it’s loaded
    if (process.env.NODE_ENV !== "production") {
        console.log("[EditProfile] EMAIL_CHANGE_FN_ID:", EMAIL_CHANGE_FN_ID);
    }

    // ========== NEW LOGIC: SAVE HANDLER ==========
    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        setSaving(true);
        try {
            if (emailChanged) {
                if (!EMAIL_CHANGE_FN_ID) {
                    setError("Email change is temporarily unavailable (missing function id).");
                    return;
                }

                try {
                    await functions.createExecution(
                        EMAIL_CHANGE_FN_ID,                                  // ✅ functionId
                        JSON.stringify({ userId: currentUser.$id, newEmail }),
                        false                                                // async = false (wait for completion)
                    );
                } catch (e: any) {
                    console.error("initiate-email-change failed:", e);
                    setError(e?.message || "Failed to send OTP to the new email.");
                    return;
                }

                router.push(
                    `/verify-otp?email=${encodeURIComponent(newEmail)}&userId=${currentUser.$id}&redirect=email-change`
                );
                return;
            }

            // If email not changed, update name/phone only
            await updateUserProfileAfterGoogleOrFirstLogin({
                name: newFullName,
                phone,
            });
            router.push("/profile");
        } catch (err: any) {
            setError(err.message || "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // --------- UNCHANGED FORM STRUCTURE/STYLES ---------
    return (
        <div className="profile-page-container-main flex items-center justify-center">
            <div className="profile-page-container container single-column">
                <div className="top-section">
                    <h1>Edit Profile</h1>
                </div>

                <form className="personal-details-container" onSubmit={handleSave}>
                    <h2>Personal Details</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                required
                                disabled={saving}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                required
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                            disabled={saving}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={emailState}
                            onChange={e => setEmailState(e.target.value)}
                            required
                            disabled={saving}
                            // Don't disable for current email, only during save
                        />
                    </div>

                    {error && <p className="form-feedback error">{error}</p>}

                    <div className="action-buttons-container">
                        <button
                            type="submit"
                            className="change-password-btn"
                            disabled={saving}
                        >
                            {saving
                                ? (emailChanged ? "Sending OTP…" : "Saving…")
                                : actionLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
