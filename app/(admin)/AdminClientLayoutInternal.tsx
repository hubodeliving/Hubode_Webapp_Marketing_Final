// File: app/(admin)/AdminClientLayoutInternal.tsx
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './components/Sidebar/Sidebar';
import { account, AppwriteException } from '@/lib/appwrite';
import { Models } from 'appwrite';
import './globals.scss';
import './layout-styles.scss';

const ADMIN_USER_LABEL = 'admin';

export default function AdminClientLayoutInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminLoginPage = pathname === '/admin/login';

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authCheckLoading, setAuthCheckLoading] = useState(true);
  const hasLoggedOutNonAdmin = useRef(false);

  // Keep a ref copy of isAdminAuthenticated to avoid stale closures in effects
  const isAdminAuthenticatedRef = useRef(isAdminAuthenticated);
  useEffect(() => {
    isAdminAuthenticatedRef.current = isAdminAuthenticated;
  }, [isAdminAuthenticated]);

  // Body class toggle for login vs dashboard
  useEffect(() => {
    const body = document.body;
    if (isAdminLoginPage) {
      body.classList.add('admin-login-page-body');
      body.classList.remove('admin-dashboard-body');
    } else {
      body.classList.remove('admin-login-page-body');
      body.classList.add('admin-dashboard-body');
    }
    return () => {
      body.classList.remove('admin-login-page-body', 'admin-dashboard-body');
    };
  }, [isAdminLoginPage]);

  useEffect(() => {
    const checkAdminSessionAndRole = async () => {
      setAuthCheckLoading(true);
      hasLoggedOutNonAdmin.current = false; // Reset flag on each check

      try {
        console.log(`[AdminLayout] Checking session for path: ${pathname}`);
        const user: Models.User<Models.Preferences> = await account.get();
        console.log(
          `[AdminLayout] Session active for user: ${user.email}, RAW labels:`,
          JSON.stringify(user.labels)
        );

        // Normalize labels to lowercase, trimmed strings
        const normalizedLabels = (user.labels || []).map((l) =>
          l.trim().toLowerCase()
        );

        if (normalizedLabels.includes(ADMIN_USER_LABEL)) {
          console.log(`[AdminLayout] User ${user.email} IS an admin.`);
          setIsAdminAuthenticated(true);
        } else {
          console.warn(
            `[AdminLayout] User ${user.email} (ID: ${user.$id}) lacks '${ADMIN_USER_LABEL}' label. Treating as non-admin.`
          );
          setIsAdminAuthenticated(false);

          if (!isAdminLoginPage && !hasLoggedOutNonAdmin.current) {
            console.log(
              `[AdminLayout] Attempting to delete session for non-admin ${user.email}`
            );
            try {
              await account.deleteSession('current');
              hasLoggedOutNonAdmin.current = true;
              console.log(
                `[AdminLayout] Session deleted for non-admin ${user.email}`
              );
            } catch (logoutError) {
              console.warn(
                '[AdminLayout] Session deletion for non-admin failed:',
                logoutError
              );
            }
          }
        }
      } catch (error: any) {
        // No active session or error fetching user
        console.log(
          '[AdminLayout] No active session or error during account.get():',
          error instanceof AppwriteException ? error.message : error
        );
        setIsAdminAuthenticated(false);
      } finally {
        setAuthCheckLoading(false);
        console.log(
          `[AdminLayout] Auth check finished. isAdminAuthenticated: ${isAdminAuthenticatedRef.current}`
        );
      }
    };

    checkAdminSessionAndRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    // Run after authCheckLoading toggles to false
    if (authCheckLoading) {
      console.log('[RedirectEffect] Waiting for auth check to complete.');
      return;
    }

    const isAdminNow = isAdminAuthenticatedRef.current;
    console.log(
      `[RedirectEffect] authCheckLoading: ${authCheckLoading}, isAdminAuthenticated: ${isAdminNow}, isAdminLoginPage: ${isAdminLoginPage}, pathname: ${pathname}`
    );

    if (!isAdminNow && !isAdminLoginPage) {
      console.log(
        '[RedirectEffect] Not admin (or no session) and not on login page. Redirecting to /admin/login.'
      );
      router.replace('/admin/login');
    } else if (isAdminNow && isAdminLoginPage) {
      console.log(
        '[RedirectEffect] Is admin but on login page. Redirecting to /admin/registrations.'
      );
      router.replace('/admin/registrations');
    } else if (pathname === '/admin' && !isAdminNow) {
      console.log('[RedirectEffect] On /admin and not admin. Redirecting to /admin/login.');
      router.replace('/admin/login');
    } else {
      console.log('[RedirectEffect] No redirection needed.');
    }
  }, [authCheckLoading, isAdminLoginPage, pathname, router]);

  if (authCheckLoading && !isAdminLoginPage) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
        }}
      >
        Verifying Admin Access...
      </div>
    );
  }

  if (isAdminLoginPage) {
    return <>{children}</>;
  }

  if (!isAdminAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
        }}
      >
        Access Denied. Redirecting to login...
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <main className="admin-main-content">{children}</main>
    </div>
  );
}
