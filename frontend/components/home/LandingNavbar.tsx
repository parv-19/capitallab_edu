"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "About Us", href: "#about-us" },
  { label: "CMA US", href: "#cma-program" },
  { label: "CFA", href: "#cfa-program" },
  { label: "Instructor", href: "#instructor" },
  { label: "Testimonials", href: "#testimonials" },
];

function scrollToSection(href: string) {
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!menuOpen) {
      document.documentElement.style.setProperty("overflow-y", "auto", "important");
      document.body.style.setProperty("overflow-y", "auto", "important");
      return;
    }

    document.documentElement.style.setProperty("overflow-y", "hidden", "important");
    document.body.style.setProperty("overflow-y", "hidden", "important");

    return () => {
      document.documentElement.style.setProperty("overflow-y", "auto", "important");
      document.body.style.setProperty("overflow-y", "auto", "important");
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const accountHref = isAuthenticated ? (user?.role === "admin" ? "/admin" : "/student") : "/login";
  const accountLabel = isAuthenticated ? "Dashboard" : "Login";

  const handleNavLinkClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    scrollToSection(href);
  };

  const handleEnrollNow = () => {
    setMenuOpen(false);
    window.location.href = "/leads?course=Help%20me%20decide";
  };

  return (
    <>
      <nav className="nav" aria-label="Primary navigation">
        <Link href="/" className="nav-logo" aria-label="Capital Lab Education home">
          <img src="/LOGO.PNG" alt="Capital Lab Education logo" />
          <div className="brand-wordmark">
            <span className="brand-main">capital</span>
            <span className="brand-accent">lab</span>
          </div>
        </Link>

        <div className="nav-links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={handleNavLinkClick(item.href)}>
              {item.label}
            </a>
          ))}
          <Link href={accountHref} className="nav-login">
            {accountLabel}
          </Link>
          <Link href="/leads" className="nav-leads">
            Book Free Call
          </Link>
          <a href="/leads?course=Help%20me%20decide" className="nav-cta" onClick={(event) => {
            event.preventDefault();
            handleEnrollNow();
          }}>
            Enroll Now
          </a>
        </div>

        <button
          type="button"
          className={`hamburger${menuOpen ? " open" : ""}`}
          aria-label="Toggle menu"
          aria-expanded={menuOpen ? "true" : "false"}
          aria-controls="reactMobileNav"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      <div
        id="reactMobileNav"
        className={`mobile-nav${menuOpen ? " open" : ""}`}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={menuOpen ? "false" : "true"}
      >
        <button type="button" className="mobile-nav-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
          &times;
        </button>

        <div className="mobile-nav-logo">
          <img src="/LOGO.PNG" alt="Capital Lab Education logo" />
          <div className="brand-wordmark">
            <span className="brand-main">capital</span>
            <span className="brand-accent">lab</span>
          </div>
        </div>

        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={handleNavLinkClick(item.href)}>
            {item.label}
          </a>
        ))}

        <Link href={accountHref} className="mobile-login" onClick={() => setMenuOpen(false)}>
          {accountLabel}
        </Link>
        <Link href="/leads" className="nav-leads" onClick={() => setMenuOpen(false)}>
          Book Free Call
        </Link>
        <a href="/leads?course=Help%20me%20decide" className="mobile-cta" onClick={(event) => {
          event.preventDefault();
          handleEnrollNow();
        }}>
          Enroll Now
        </a>
      </div>
    </>
  );
}
