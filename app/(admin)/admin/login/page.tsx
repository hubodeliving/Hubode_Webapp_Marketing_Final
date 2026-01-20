// File: app/(admin)/login/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { account, AppwriteException } from '@/lib/appwrite';
import './style.scss';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }

    try {
      // Create a real Appwrite email/password session
      await account.createEmailPasswordSession(trimmedUsername, trimmedPassword);
      console.log('[AdminLogin] Appwrite session created for', trimmedUsername);
      router.replace('/admin/registrations');
    } catch (err: any) {
      console.error('[AdminLogin] Appwrite login error:', err);
      const message =
        err instanceof AppwriteException && err.message
          ? err.message
          : 'Invalid username or password.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page-container">
      <div className="admin-login-form-wrapper">
        <h1>Welcome Back Admin!</h1>
        <form onSubmit={handleLoginSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Email</label>
            <input
              type="email"
              id="username"
              name="username"
              placeholder="admin@example.com"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="form-feedback error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-login" disabled={isLoading}>
            {isLoading ? 'Logging In...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
