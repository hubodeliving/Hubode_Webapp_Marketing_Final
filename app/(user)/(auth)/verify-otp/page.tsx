"use client";

import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { account, AppwriteException, functions } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import "./style.scss";

const OTP_LEN = 6;
const USER_CONTEXT_ERROR = "User context missing. Restart the flow.";

// Read function ids from env (must be exposed as NEXT_PUBLIC_* in your env)
const FN_ID_LOGIN_OTP = process.env.NEXT_PUBLIC_FN_ID_LOGIN_OTP || "send-login-otp";
const FN_ID_INITIATE_EMAIL_CHANGE = process.env.NEXT_PUBLIC_FN_ID_INITIATE_EMAIL_CHANGE || "";

export default function VerifyOtpPage() {
    const { loginWithEmailOtp, isLoading: ctxLoad, completeVerification, checkUserSession } = useAuth();
    const router = useRouter();
    const params = useSearchParams();

    const email  = params.get("email")  || "";
    const queryUserId = params.get("userId") || "";
    const redirect = params.get("redirect"); // "forgot-password" | "profile-edit" | "email-change" | "signup-verify" | null
    const isSignupVerify = redirect === "signup-verify";

    // state ---------------------------------------------------------
    const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [signupUserId, setSignupUserId] = useState<string | null>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const sentOnce = useRef(false);
    const effectiveUserId = isSignupVerify ? (signupUserId || queryUserId) : queryUserId;

    useEffect(() => {
        if (!isSignupVerify) {
            setSignupUserId(null);
            return;
        }
        if (typeof window === "undefined") {
            setSignupUserId(null);
            return;
        }
        try {
            const stored = localStorage.getItem("signupUserId");
            setSignupUserId(stored);
        } catch {
            setSignupUserId(null);
        }
    }, [isSignupVerify]);

    useEffect(() => {
        if (!effectiveUserId && error !== USER_CONTEXT_ERROR) {
            setError(USER_CONTEXT_ERROR);
        } else if (effectiveUserId && error === USER_CONTEXT_ERROR) {
            setError(null);
        }
    }, [effectiveUserId, error]);

    // Auto-send only for email-change (the edit profile flow already initiated this; this is a safety net)
    useEffect(() => {
        if (!effectiveUserId || sentOnce.current) return;
        if (redirect === "email-change") {
            sentOnce.current = true;
            if (!FN_ID_INITIATE_EMAIL_CHANGE) {
                // Don’t block the page, just surface a useful error
                setError("Email-change function is not configured.");
                return;
            }
            functions.createExecution(
                FN_ID_INITIATE_EMAIL_CHANGE,
                JSON.stringify({ userId: effectiveUserId, newEmail: email }),
                false
            ).catch(() => {
                // Soft-fail; user can press Resend
            });
        }
    }, [effectiveUserId, email, redirect]);

    // Resend countdown
    useEffect(() => {
        if (resendTimer === 0) return;
        const id = setInterval(() => setResendTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [resendTimer]);

    const readyCode = (values: string[]): string | null => {
        const joined = values.join("");
        if (!joined) return null;
        if (isSignupVerify) {
            // consider ready when every box is non-empty
            const allFilled = values.every((v) => v && v.length > 0);
            return allFilled ? joined : null;
        }
        return joined.length === OTP_LEN ? joined : null;
    };

    const tryAutoSubmit = (values: string[]) => {
        if (loading || ctxLoad) return;
        const code = readyCode(values);
        if (code) submit(code);
    };

    // helpers -------------------------------------------------------
    const handleChange = (i: number, e: ChangeEvent<HTMLInputElement>) => {
        const next = [...otp];

        if (isSignupVerify) {
            const raw = e.target.value;
            if (!raw) {
                next[i] = "";
                setOtp(next);
                return;
            }
            const char = raw[raw.length - 1];
            next[i] = char;
            setOtp(next);
            if (char && i < OTP_LEN - 1) inputRefs.current[i + 1]?.focus();
            tryAutoSubmit(next);
            return;
        }

        const sanitized = e.target.value.replace(/\D/g, "");
        if (!sanitized) {
            next[i] = "";
            setOtp(next);
            return;
        }

        const char = sanitized[sanitized.length - 1];
        next[i] = char;
        setOtp(next);

        if (char && i < OTP_LEN - 1) {
            inputRefs.current[i + 1]?.focus();
        }

        tryAutoSubmit(next);
    };

    const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = (e.clipboardData?.getData("text") || "").trim();
        if (!pasted) return;

        const next = [...otp];

        if (isSignupVerify) {
            let cursor = i;
            for (const ch of pasted) {
                if (cursor >= OTP_LEN) break;
                next[cursor] = ch;
                cursor += 1;
            }
            if (cursor < OTP_LEN) {
                for (let idx = cursor; idx < OTP_LEN; idx += 1) next[idx] = "";
            }
            setOtp(next);
            if (cursor <= OTP_LEN - 1) inputRefs.current[cursor]?.focus();
            tryAutoSubmit(next);
            return;
        }

        const sanitized = pasted.replace(/\D/g, "");
        if (!sanitized) return;

        let cursor = i;
        for (const char of sanitized) {
            if (cursor >= OTP_LEN) break;
            next[cursor] = char;
            cursor += 1;
        }

        if (cursor < OTP_LEN) {
            for (let idx = cursor; idx < OTP_LEN; idx += 1) {
                next[idx] = "";
            }
        }

        setOtp(next);

        if (cursor <= OTP_LEN - 1) {
            inputRefs.current[cursor]?.focus();
        } else {
            inputRefs.current[OTP_LEN - 1]?.blur();
        }

        tryAutoSubmit(next);
    };

    const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[i] && i > 0) {
            inputRefs.current[i - 1]?.focus();
        }
    };

    const submit = async (code: string) => {
        const activeUserId = effectiveUserId;
        if (!activeUserId) {
            setError(USER_CONTEXT_ERROR);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            if (redirect === "forgot-password") {
                // PASSWORD-RESET FLOW
                router.replace(`/forgot-password/set-password?userId=${activeUserId}&secret=${code}`);
                return;
            }

            if (redirect === "profile-edit") {
                // Require OTP login before letting them edit profile
                await loginWithEmailOtp(activeUserId, code);
                router.replace("/profile/edit");
                return;
            }

            if (redirect === "email-change") {
                // Verify numeric OTP for email-change via API route
                const resp = await fetch("/api/email-change/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: activeUserId, newEmail: email, otp: code }),
                });
                if (!resp.ok) {
                    const j = await resp.json().catch(() => ({}));
                    throw new Error(j.error || "Email change verification failed.");
                }
                // Refresh current user so UI shows the updated email without manual reload
                try { await checkUserSession(); } catch {}
                router.replace("/profile");
                return;
            }

            if (isSignupVerify) {
                // Complete signup verification and keep the user logged in
                await completeVerification(activeUserId, code);
                try { localStorage.removeItem("signupUserId"); } catch {}
                router.replace("/");
                return;
            }

            // Default = LOGIN OTP (numeric) FLOW
            await loginWithEmailOtp(activeUserId, code);
            router.push("/");
        } catch (e: any) {
            if (isSignupVerify) {
                setError("Invalid or expired verification code.");
            } else {
                setError(e instanceof AppwriteException ? e.message : (e?.message || "Invalid code."));
            }
            setOtp(Array(OTP_LEN).fill(""));
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const resend = async () => {
        const activeUserId = effectiveUserId;
        if (resendTimer > 0 || !activeUserId) {
            if (!activeUserId) setError(USER_CONTEXT_ERROR);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            if (redirect === "email-change") {
                if (!FN_ID_INITIATE_EMAIL_CHANGE) {
                    throw new Error("Email-change function is not configured.");
                }
                await functions.createExecution(
                    FN_ID_INITIATE_EMAIL_CHANGE,
                    JSON.stringify({ userId: activeUserId, newEmail: email }),
                    false
                );
            } else if (isSignupVerify) {
                // Resend Appwrite native email verification code
                await account.createEmailToken(activeUserId, email);
            } else {
                // Default/login OTP resend
                await functions.createExecution(
                    FN_ID_LOGIN_OTP,
                    JSON.stringify({ mode: "send", userId: activeUserId, email }),
                    false
                );
            }
            setResendTimer(60);
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "Resend failed. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    const joinedOtp = otp.join("");
    const verifyDisabled =
        loading ||
        ctxLoad ||
        !effectiveUserId ||
        (!isSignupVerify && joinedOtp.length !== OTP_LEN) ||
        (isSignupVerify && joinedOtp.length === 0);

    // UI ------------------------------------------------------------
    return (
        <div className="otp-page-container">
            <div className="otp-content-wrapper">
                <h1 className="otp-title">Enter the code</h1>
                <p className="otp-subtitle">
                    We sent a 6-digit code to <span className="otp-email">{email}</span>. Check your spam folder if you can't find it.
                </p>

                <div className="otp-input-fields">
                    {otp.map((d, i) => (
                        <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            type="text"
                            inputMode={isSignupVerify ? "text" : "numeric"}
                            maxLength={isSignupVerify ? undefined : 1}
                            value={d}
                            onChange={(e) => handleChange(i, e)}
                            onPaste={(e) => handlePaste(i, e)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className={`otp-input ${error ? "error" : ""}`}
                            disabled={loading || ctxLoad}
                        />
                    ))}
                </div>

                {error && <p className="form-feedback error otp-error">{error}</p>}

                <button
                    onClick={() => submit(joinedOtp)}
                    className="btn btn-submit-auth"
                    disabled={verifyDisabled}
                >
                    {loading || ctxLoad ? "Verifying…" : "Verify & Login"}
                </button>

                <div className="resend-otp-section">
                    Didn&apos;t get it?{" "}
                    <button onClick={resend} disabled={resendTimer > 0 || loading}>
                        Resend {resendTimer > 0 && `(${resendTimer}s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
