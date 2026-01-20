import { account, AppwriteException, ID, databases, functions } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
// This is the corrected import line:
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import crypto from 'crypto';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLL_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_ID!;
const VERIFY_LOGIN_OTP_FUNCTION_ID = '690ef7c20015524010eb'

// Utility to split full name into first and last names
const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
};

interface AuthContextType {
  currentUser: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ userId: string; email: string }>;
  signup: (name: string, email: string, pass: string, phone?: string) => Promise<{ userId: string; email: string }>;
  completeVerification: (userId: string, secret: string) => Promise<void>;
  logout: () => Promise<void>;
  initiateGoogleAuth: () => void;
  checkUserSession: () => Promise<void>;
  updateUserProfileAfterGoogleOrFirstLogin: (userData: { name?: string, phone?: string }) => Promise<void>;
  loginWithEmailOtp: (userId: string, otp: string) => Promise<void>;
  sendResetOtp: (email: string) => Promise<{ userId: string }>;
  resetPassword: (userId: string, newPassword: string) => Promise<void>;
  sendPasswordRecovery: (email: string) => Promise<void>;
  resetPasswordWithOtp: (userId: string, secret: string, newPassword: string, confirmPassword: string) => Promise<void>;
  sendEmailChangeOtp: (userId: string, newEmail: string) => Promise<void>;
  updateEmailWithOtp: (userId: string, secret: string, newEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const redirectIfProfileIncomplete = (
    user: Models.User<Models.Preferences> | null
  ) => {
    const needsProfile =
      user &&
      (!user.prefs?.completedProfile || !user.prefs?.phone?.length);
    if (needsProfile && !pathname.startsWith('/signup')) {
      router.replace('/signup?isGoogleSignup=true');
    }
  };

  // Helper: Create or update profile document using userId as document ID
  const upsertProfileDocument = async (user: Models.User<Models.Preferences>) => {
    try {
      const { firstName, lastName } = splitName(user.name);
      const phone = user.prefs?.phone || user.phone || 'N/A';

      const documentId = user.$id;

      const result = await databases.listDocuments(DB_ID, COLL_ID, [
        Query.equal('$id', documentId),
      ]);

      if (result.total === 0) {
        await databases.createDocument(
          DB_ID,
          COLL_ID,
          documentId,
          {
            userId: user.$id,
            email: user.email,
            phone,
            name: user.name,
            firstName,
            lastName
          }
        );
      } else {
        await databases.updateDocument(
          DB_ID,
          COLL_ID,
          documentId,
          {
            email: user.email,
            phone,
            name: user.name,
            firstName,
            lastName
          }
        );
      }
    } catch (error) {
      console.error("Failed to upsert profile document:", error);
    }
  };

  const checkUserSession = async () => {
    setIsLoading(true);
    try {
      const user = await account.get();
      setCurrentUser(user);
      await upsertProfileDocument(user);
      redirectIfProfileIncomplete(user);
    } catch (error) {
      setCurrentUser(null);
      if (!(error instanceof AppwriteException && error.code === 401)) {
        console.info("No active session or error during checkUserSession:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  const createEmailPwSession = (email: string, pass: string) => {
    const anyAccount = account as any;
    if (typeof anyAccount.createEmailPasswordSession === "function") {
      return anyAccount.createEmailPasswordSession(email, pass);
    }
    return anyAccount.createEmailSession(email, pass);
  };

// Update the login function
const login = async (
  email: string,
  pass: string
): Promise<{ userId: string; email: string }> => {
  setIsLoading(true);
  try {
    // 1. Create a session to validate the user's password.
    await createEmailPwSession(email, pass);
    
    // 2. If password is correct, get the user's details.
    const user = await account.get();
    const { $id: userId, email: userEmail } = user;

    // 3. ✅ CHANGE: Trigger the NEW numeric OTP function
    await functions.createExecution(
  'send-login-otp', // The combined function!
  JSON.stringify({ mode: "send", userId, email: userEmail }),
  false
);


    // 4. Immediately delete the password-based session.
    await account.deleteSession('current');
    setCurrentUser(null);

    // 5. Return user details for the OTP page.
    return { userId, email: userEmail };

  } catch(e) {
    await account.deleteSession('current').catch(() => {});
    setCurrentUser(null);
    throw e;
  } finally {
    setIsLoading(false);
  }
};

  const signup = async (
    name: string,
    email: string,
    pass: string,
    phone?: string
  ): Promise<{ userId: string; email: string }> => {
    if (phone) {
      try {
        const res = await databases.listDocuments(DB_ID, COLL_ID, [
          Query.equal('phone', phone),
        ]);
        if (res.total > 0) {
          const doc = res.documents[0] as any;
          await account.createEmailToken(doc.userId, doc.email);
          return { userId: doc.userId, email: doc.email };
        }
      } catch (_) {}
    }

    let newUser: Models.User;
    try {
      newUser = await account.create(ID.unique(), email, pass, name);
    } catch (e) {
      if (e instanceof AppwriteException && e.code === 409) {
        const cachedId = localStorage.getItem(`pendingUserId_${email}`);
        if (cachedId) {
          await account.createEmailToken(cachedId, email);
          if (phone) localStorage.setItem(`pendingPhone_${cachedId}`, phone);
          return { userId: cachedId, email };
        }
        throw new AppwriteException('An account with that email already exists. Please log in.');
      }
      throw new AppwriteException('Could not create account. Please try again.');
    }

    localStorage.setItem(`pendingUserId_${email}`, newUser.$id);

    if (phone) {
      try {
        const { firstName, lastName } = splitName(newUser.name);
        await databases.createDocument(
          DB_ID,
          COLL_ID,
          newUser.$id,
          {
            userId: newUser.$id,
            phone,
            email: newUser.email,
            name: newUser.name,
            firstName,
            lastName
          }
        );
      } catch (e) {
        await account.delete(newUser.$id);
        if (e instanceof AppwriteException && e.code === 409) {
          throw new AppwriteException('That phone number is already in use.');
        }
        throw new AppwriteException('Could not save your phone number. Please try again.');
      }
    }

    try {
      await account.createEmailToken(newUser.$id, newUser.email);
    } catch (e) {
      throw new AppwriteException('Failed to send verification code. Please try again.');
    }

    if (phone) localStorage.setItem(`pendingPhone_${newUser.$id}`, phone);
    return { userId: newUser.$id, email: newUser.email };
  };

  const sendPasswordRecovery = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      await account.createRecovery(
        email.trim().toLowerCase(),
        `${window.location.origin}/forgot-password/set-password`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (
    userId: string,
    newPassword: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await account.updateRecovery(userId, "", newPassword, newPassword);
      await checkUserSession();
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordWithOtp = async (
    userId: string,
    secret: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await account.updateRecovery(userId, secret, newPassword, confirmPassword);
    } finally {
      setIsLoading(false);
    }
  };

const loginWithEmailOtp = async (userId: string, otp: string): Promise<void> => {
  setIsLoading(true);
  try {
    // Always clear any previous session for security
    try {
      await account.deleteSession("current");
    } catch {
      // ignore logout errors
    }

    // --- CALL THE VERIFY-LOGIN-OTP-NUMERIC CLOUD FUNCTION ---
    const execution = await functions.createExecution(
  'send-login-otp', // Combined function ID!
  JSON.stringify({ mode: "verify", userId, otp }),
  false
);


    // Parse the function response
    const response = JSON.parse(execution.responseBody || '{}');

    // Fail fast if function returns error
    if (!response.success) {
      throw new Error(response.message || 'OTP verification failed.');
    }

    // --- USE THE TOKEN SECRET TO CREATE APPWRITE SESSION ---
    // The magic link/session token from users.createToken
    const { secret } = response;
    if (!secret || typeof secret !== "string") {
      throw new Error("No valid session token received from verification function.");
    }

    // Now create a session using the returned token secret (no password required)
    await account.createSession(userId, secret);

    // Get the newly logged-in user
    let user = await account.get();
    const currentPrefs = user.prefs || {};
    const prefsToUpdate: Models.Preferences = { ...currentPrefs };

    // --- COMPLETION LOGIC (OPTIONAL, CAN BE CUSTOMIZED) ---
    const pend = localStorage.getItem(`pendingPhone_${user.$id}`);
    let prefsHaveChanged = false;

    // If there's a pending phone, attach it to user's preferences
    if (pend) {
      prefsToUpdate.phone = pend;
      localStorage.removeItem(`pendingPhone_${user.$id}`);
      prefsHaveChanged = true;
    }

    // Mark profile as complete if needed
    if (!currentPrefs.completedProfile) {
      prefsToUpdate.completedProfile = true;
      prefsHaveChanged = true;
    }

    // Update preferences if changed
    if (prefsHaveChanged) {
      await account.updatePrefs(prefsToUpdate);
      user = await account.get(); // re-fetch user for latest prefs
    }

    setCurrentUser(user);
    await upsertProfileDocument(user);

  } catch (error) {
    console.error('OTP login error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};





  const completeVerification = async (userId: string, secret: string): Promise<void> => {
    // Create an Appwrite session from the verification token
    await account.createSession(userId, secret);

    // Fetch the session user
    let user = await account.get();

    // Ensure phone + completedProfile are persisted if we captured them during signup
    const currentPrefs = user.prefs || {};
    const prefsToUpdate: Models.Preferences = { ...currentPrefs };
    let prefsHaveChanged = false;

    const pend = typeof window !== 'undefined' ? localStorage.getItem(`pendingPhone_${user.$id}`) : null;
    if (pend) {
      prefsToUpdate.phone = pend;
      try { localStorage.removeItem(`pendingPhone_${user.$id}`); } catch {}
      prefsHaveChanged = true;
    }
    if (!currentPrefs.completedProfile) {
      prefsToUpdate.completedProfile = true;
      prefsHaveChanged = true;
    }

    if (prefsHaveChanged) {
      await account.updatePrefs(prefsToUpdate);
      user = await account.get();
    }

    // Best-effort: mark email verified via admin API (in case flags lag)
    try {
      await fetch('/api/auth/mark-email-verified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.$id })
      });
    } catch { /* ignore */ }

    setCurrentUser(user);
    await upsertProfileDocument(user);
  };

  const updateUserProfileAfterGoogleOrFirstLogin = async (
    userData: { name?: string; phone?: string }
  ): Promise<void> => {
    if (!currentUser) {
      console.warn("[AuthContext] No current user session to update profile. Attempting to fetch.");
      try {
        await checkUserSession();
        if (!currentUser) throw new Error("No user session found after refresh.");
      } catch (e) {
        throw new Error("User session not available for profile update.");
      }
    }

    try {
      const userToUpdate = currentUser!;
      const currentPrefs = userToUpdate.prefs || {};
      const prefsToUpdate: Models.Preferences = { ...currentPrefs, completedProfile: true };

      if (userData.phone) prefsToUpdate.phone = userData.phone;
      let nameUpdated = false;

      if (userData.name && userToUpdate.name !== userData.name) {
        await account.updateName(userData.name);
        nameUpdated = true;
      }

      if (userData.phone || !currentPrefs.completedProfile || nameUpdated) {
        await account.updatePrefs(prefsToUpdate);
      }

      const updatedUser = await account.get();
      setCurrentUser(updatedUser);
      await upsertProfileDocument(updatedUser);

      if (userData.phone) localStorage.removeItem(`pendingPhone_${userToUpdate.$id}`);
    } catch (error) {
      console.error("[AuthContext] Error updating profile:", error);
      throw error;
    }
  };

  const updateEmailWithOtp = async (
    userId: string,
    secret: string,
    newEmail: string
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await account.updateEmail(newEmail, secret);

      const docs = await databases.listDocuments(DB_ID, COLL_ID, [
        Query.equal("userId", userId),
      ]);

      if (docs.total > 0) {
        await databases.updateDocument(
          DB_ID,
          COLL_ID,
          docs.documents[0].$id,
          { email: newEmail }
        );
      }

      const usr = await account.get();
      setCurrentUser(usr);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession('current');
      setCurrentUser(null);
      router.push('/login');
    } catch (error) {
      setCurrentUser(null);
      router.push('/login');
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const initiateGoogleAuth = () => {
    const successUrl = `${window.location.origin}/login?oauth=success`;
    const failureUrl = `${window.location.origin}/login?error=google_failed`;
    try {
      account.createOAuth2Session("google", successUrl, failureUrl);
    } catch (error) {
      console.error("Failed to initiate Google OAuth:", error);
      router.push(failureUrl);
    }
  };

  const sendEmailChangeOtp = async (userId: string, newEmail: string): Promise<void> => {
    try {
      await account.createEmailToken(userId, newEmail);
    } catch (e: any) {
      const duplicate =
        e?.message?.includes("Document already exists") ||
        e?.type?.toString().toLowerCase().includes("duplicate") ||
        e?.code === 409;
      if (!duplicate) throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isLoading,
      login,
      signup,
      completeVerification,
      logout,
      initiateGoogleAuth,
      checkUserSession,
      updateUserProfileAfterGoogleOrFirstLogin,
      loginWithEmailOtp,
      sendResetOtp: sendPasswordRecovery,
      resetPassword,
      sendPasswordRecovery,
      resetPasswordWithOtp,
      sendEmailChangeOtp,
      updateEmailWithOtp
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
