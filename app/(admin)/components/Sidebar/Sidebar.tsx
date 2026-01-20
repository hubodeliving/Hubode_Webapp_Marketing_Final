// File: app/(admin)/components/Sidebar/Sidebar.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image'; // For the logo
import './sidebar.scss';
import { account } from '@/lib/appwrite';

interface NavItem {
  href: string;
  label: string;
  iconBaseName: string;
}

const navItems: NavItem[] = [
  { href: '/admin/registrations', label: 'Registrations', iconBaseName: 'registrations-icon' },
  { href: '/admin/rent-management', label: 'Rent Management', iconBaseName: 'rent-management-icon' },
  { href: '/admin/all-users', label: 'All Users', iconBaseName: 'user-admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      router.replace('/admin/login');
    }
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <Link href="/admin/dashboard" passHref legacyBehavior>
          <a className="logo-link">
            <Image src="/images/Logo-green.svg" alt="Hubode Logo" width={140} height={40} />
          </a>
        </Link>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <a className={`nav-link ${isActive ? 'active' : ''}`}>
                    <Image
                      src={`/images/${item.iconBaseName}${isActive ? '-white' : ''}.svg`}
                      alt={`${item.label} icon`}
                      width={20}
                      height={20}
                      className="nav-icon"
                    />
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-button">
          <Image
            src={`/images/logout-admin.svg`}
            alt="Logout icon"
            width={20}
            height={20}
            className="nav-icon"
          />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
