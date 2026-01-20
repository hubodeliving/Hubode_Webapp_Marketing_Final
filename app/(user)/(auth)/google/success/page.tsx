// File: app/auth/google/success/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path
import { Models } from 'appwrite';
import { account, AppwriteException } from '@/lib/appwrite'; // Adjust path

export default function GoogleAuthSuccessPage() {
    const router = useRouter();
    const { checkUserSession, currentUser } = useAuth(); // Get currentUser from context

    useEffect(() => {
        const handleOAuthSuccess = async () => {
            try {
                // The session should have been set by Appwrite redirect.
                // We fetch the user to confirm and get details.
                const user = await account.get();

                // Check if this is a "new" user from Google OAuth
                // Appwrite's user object has a 'registration' timestamp.
                // A common way is to see if their registration date is very recent.
                const registrationDate = new Date(user.registration);
                const خمسهMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

                if (registrationDate > خمسهMinutesAgo && !user.emailVerification) {
                    // Likely a brand new user via OAuth, guide them to complete profile
                    // Or, if their email is already verified by Google, you might skip OTP.
                    // For this flow, let's assume we want them to fill phone etc.
                    console.log("New user from Google OAuth, redirecting to signup completion.");
                    router.push(
                        `/signup?isGoogleSignup=true&email=${encodeURIComponent(user.email)}&firstName=${encodeURIComponent(user.name.split(' ')[0] || '')}&lastName=${encodeURIComponent(user.name.split(' ').slice(1).join(' ') || '')}`
                    );
                } else {
                    // Existing user or returning OAuth user
                    await checkUserSession(); // Update context
                    router.push('/'); // Redirect to dashboard or home
                }
            } catch (error) {
                console.error("Error handling OAuth success:", error);
                if (error instanceof AppwriteException) {
                    router.push(`/login?error=${encodeURIComponent(error.message)}`);
                } else {
                    router.push('/login?error=oauth_verification_failed');
                }
            }
        };

        handleOAuthSuccess();
    }, [router, checkUserSession]); // Removed currentUser from deps to avoid loop if it updates

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>Processing your Google authentication...</p>
            {/* Add a spinner/loader here */}
        </div>
    );
}