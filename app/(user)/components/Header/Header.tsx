// File: components/Header/Header.tsx
"use client"; // Needed for useState/useEffect hooks

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Header.scss";
import { useAuth } from "@/context/AuthContext";


/* ------------------------------------------------------------------ */
/*  Types & menu data                                                 */
/* ------------------------------------------------------------------ */

interface SubmenuItem {
  text: string;
  href: string;
  scrollTarget?: string;
}
interface MenuItem {
  id: string;
  title: string;
  links: SubmenuItem[];
  isUserMenu?: boolean; // Flag for user menu to style icon differently
}



/* ------------------------------------------------------------------ */

interface HeaderProps {
  isAltTheme?: boolean; // This prop comes from RootLayout
}

// --- BASE MENU DATA STRUCTURE (Can stay outside if it doesn't depend on component state/props directly) ---
const baseMenuData: Omit<MenuItem, 'links'> & { getLinks: (isUserLoggedIn: boolean) => SubmenuItem[] }[] = [
  {
    id: "locations",
    title: "Locations",
    getLinks: (isUserLoggedIn) => [
      { text: "Kozhikode", href: "/#find-your-home", scrollTarget: "find-your-home" },
    ],
  },
  {
    id: "about",
    title: "About",
    getLinks: (isUserLoggedIn) => [
      // { text: "Community", href: "/community" },
      { text: "About Us", href: "/about" },
      { text: "Our Journal", href: "/blog" },
      { text: "Refer a Friend", href: "/refer-a-friend" },
      { text: "Careers", href: "/career" },
      { text: "Hubode Offerings", href: "/hubode-offerings" }
    ],
  },
  {
    id: "contact",
    title: "Contact",
    getLinks: (isUserLoggedIn) => {
      const contactLinks: SubmenuItem[] = [
        { text: "FAQ", href: "/faq" },
        {text: "Partner With Hubode", href: "/partner-with-us"},
        { text: "Contact", href: "/contact" },
      ];
      // if (isUserLoggedIn) {
      //   contactLinks.unshift({ text: "Report an Issue", href: "/support" });
      // }
      return contactLinks;
    },
  },
];

const userMenuData = {
  id: "user",
};

const Header = ({ isAltTheme = false }: HeaderProps) => {
  const pathname = usePathname();
  // ↓ add this inside Header(), next to your other hooks ↓
    const { currentUser, logout } = useAuth();

  // Determine if the current page should use the "alt-theme"
  // The 'isAltTheme' prop from RootLayout is the primary determinant.
  // Additional path-based checks within Header can supplement this if RootLayout cannot determine all cases.
  const isAltThemePage = isAltTheme || // Use prop from RootLayout first
    (pathname.startsWith("/careers/") && pathname.length > "/careers/".length) ||
    (pathname.startsWith("/blog/") && pathname.length > "/blog/".length) ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/verify-otp" ||
    pathname === "/profile" ||
    (pathname.startsWith("/profile/") && pathname.length > "/profile/".length) ||
    pathname === "/forgot-password" ||
    pathname === "/partner-with-us";


  /* ---------- scroll state ---------- */
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    onScroll(); // run once at mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- open/close state (desktop & mobile) ---------- */
  const [openDesktopMenu, setOpenDesktopMenu] = useState<string | null>(null);
  const [hoveredItemText, setHoveredItemText] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /* ---------- refs for outside-click handling ---------- */
  const desktopMenuRefs = useRef<{ [k: string]: HTMLDivElement | null }>({});
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);

  /* ---------- close when clicking outside menus ---------- */


  // --- Generate the actual menuData based on login status ---
 const currentMenuData: MenuItem[] = useMemo(() => {
    return baseMenuData.map(menu => ({
      id: menu.id,
      title: menu.title,
      links: menu.getLinks(!!currentUser) // Now currentUser will have its value from useAuth
    }));
  }, [currentUser]);



  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;

      // desktop dropdown (including user menu)
      if (openDesktopMenu) {
        const menuEl = desktopMenuRefs.current[openDesktopMenu];
        // Updated selector to include user menu button
        const trigger = document.querySelector(
          `.link-item[data-menu-id="${openDesktopMenu}"], .user-menu-button[data-menu-id="${openDesktopMenu}"]`
        );
        if (
          menuEl &&
          !menuEl.contains(t) &&
          trigger &&
          !trigger.contains(t)
        ) {
          setOpenDesktopMenu(null);
        }
      }

      // mobile menu
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(t) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(t)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openDesktopMenu, isMobileMenuOpen]);

  /* ---------- lock body scroll when mobile menu open ---------- */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("mobile-menu-is-open");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("mobile-menu-is-open");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("mobile-menu-is-open");
    };
  }, [isMobileMenuOpen]);

  /* ---------- theme-aware assets ---------- */
  const isGreenMode = isAltThemePage && !isScrolled; // White header background means green assets
  const logoSrc = isScrolled ? "/images/footer-logo.svg" : (isGreenMode ? "/images/Logo-green.svg" : "/images/Logo.svg");
  const arrowIconSrc = isGreenMode ? "/images/down-green.svg" : "/images/down-arrow-white.svg";
  const userIconSrc = isGreenMode ? "/images/user-icon-green.svg" : "/images/user-icon-white.svg"; // User icon

  /* ---------- helpers ---------- */
  const toggleDesktopMenu = (id: string) =>
    setOpenDesktopMenu((prev) => (prev === id ? null : id));

  const closeAllMenus = () => {
    setOpenDesktopMenu(null);
    setIsMobileMenuOpen(false);
    setHoveredItemText(null);
  };

  const handleMenuLinkClick = (event: React.MouseEvent, link: SubmenuItem) => {
    if (link.scrollTarget && pathname === "/") {
      const targetEl = document.getElementById(link.scrollTarget);
      if (targetEl) {
        event.preventDefault();
        closeAllMenus();
        window.requestAnimationFrame(() => {
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
    }
    closeAllMenus();
  };

  const triggerWaitlistPopup = () => {
    closeAllMenus();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-waitlist-popup'));
    }
  };

    const userMenuItems = currentUser
      ? [
          { text: "Profile", href: "/profile" },
          { text: "Purchase History", href: "/profile/purchase-history" },
          {
            text: "Logout",
            onClick: async () => {
              await logout();
              closeAllMenus();
            },
          },
        ]
      : [
          { text: "Login / Register", href: "/login" },
        ];
  

  /* ------------------------------------------------------------------ */
  /*  render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <header
      className={`header-container-main flex items-center justify-center
        ${isScrolled ? "scrolled" : ""}
        ${isAltThemePage ? "alt-theme" : ""}`} // Use isAltThemePage for the class
    >
      <div className="header-container container flex justify-between items-center">
        {/* ------------------ mobile logo ------------------ */}
        <div className="logo-container-mobile">
          <Link href="/" onClick={closeAllMenus}>
            <img src={logoSrc} alt="Hubode Logo" className="main-logo" />
          </Link>
        </div>

        {/* ------------------ desktop nav ------------------ */}
        <div className="left-side-container desktop-nav">
          <nav className="links-container flex items-center">
            {currentMenuData.map((menu) => (
              <div
                key={menu.id}
                ref={(el) => (desktopMenuRefs.current[menu.id] = el)}
                className="link-item-wrapper"
              >
                <button
                  type="button"
                  className={`link-item flex items-center ${
                    openDesktopMenu === menu.id ? "active" : ""
                  } ${
                       menu.links.some(link => pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))) ? 'active-section' : ''
                   }`}
                  onClick={() => toggleDesktopMenu(menu.id)}
                  aria-haspopup="true"
                  aria-expanded={openDesktopMenu === menu.id}
                  data-menu-id={menu.id}
                >
                  <p>{menu.title}</p>
                  <img
                    src={arrowIconSrc}
                    alt={
                      openDesktopMenu === menu.id ? "Close menu" : "Open menu"
                    }
                    className="arrow-icon"
                  />
                </button>

                {openDesktopMenu === menu.id && (
                  <div className="dropdown-menu">
                    {menu.links.map((link) => (
                      <Link
                        href={link.href}
                        key={link.text}
                        className={`dropdown-item${
                          hoveredItemText === link.text ? " active" : ""
                        }${pathname === link.href ? " current-page" : ""}`}
                        onMouseEnter={() => setHoveredItemText(link.text)}
                        onMouseLeave={() => setHoveredItemText(null)}
                        onClick={(event) => handleMenuLinkClick(event, link)}
                      >
                        {link.text}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* ------------------ center logo (desktop) ------------------ */}
        <div className="center-side-container desktop-logo">
          <Link href="/" onClick={closeAllMenus}>
            <img src={logoSrc} alt="Hubode Logo" className="main-logo" />
          </Link>
        </div>

        {/* ------------------ desktop buttons & USER MENU ------------------ */}
        <div className="right-side-container desktop-nav">
          <div className="buttons-container flex items-center">
            <button
              type="button"
              onClick={triggerWaitlistPopup}
              className="desktop-button"
            >
              Prebook Now
            </button>
            <Link
              href="/contact"
              onClick={closeAllMenus}
              className="desktop-button btn-green"
            >
              Contact Us
            </Link>

            {/* --- USER MENU BUTTON & DROPDOWN --- */}
           
            {/* --- END USER MENU --- */}

          </div>
        </div>

        {/* ------------------ hamburger (mobile) ------------------ */}
        <button
          ref={hamburgerRef}
          className={`hamburger-menu-button ${isMobileMenuOpen ? "open" : ""}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? "Close main menu" : "Open main menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu-nav"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* ------------------ mobile off-canvas menu ------------------ */}
      <div
        ref={mobileMenuRef}
        id="mobile-menu-nav"
        className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}
      >
        <div className="mobile-menu-content">
          <nav className="mobile-nav-links">
            {currentMenuData.map((menu) => (
              <div key={menu.id} className="mobile-menu-group">
                <p className="mobile-menu-category">{menu.title}</p>
                {menu.links.map((link) => (
                  <Link
                    href={link.href}
                    key={link.text}
                    className={pathname === link.href ? "current-page" : ""}
                    onClick={closeAllMenus}
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            ))}
            {/* User links in mobile menu */}
            {/* Dynamic User links in mobile menu */}
<div className="mobile-menu-group">
  <p className="mobile-menu-category">My Account</p>
  {userMenuItems.map((item) =>
    item.href ? (
      <Link
        href={item.href}
        key={item.text}
        className={pathname === item.href ? "current-page" : ""}
        onClick={closeAllMenus}
      >
        {item.text}
      </Link>
    ) : (
      <button
        key={item.text}
        className="btn-mobile"
        onClick={async () => {
          await logout();
          closeAllMenus();
        }}
      >
        {item.text}
      </button>
    )
  )}
</div>

          </nav>

          <div className="mobile-menu-buttons">
            <button
              type="button"
              className="btn-mobile"
              onClick={triggerWaitlistPopup}
            >
              Prebook Now
            </button>
            <Link
              href="/contact"
              className="btn-mobile btn-green"
              onClick={closeAllMenus}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------ overlay when mobile menu open ------------------ */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "visible" : ""}`}
        onClick={closeAllMenus}
      />
    </header>
  );
};

export default Header;
