"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Why us", href: "#why" },
  { label: "Programs", href: "#programs" },
  { label: "Instructor", href: "#instructor" },
  { label: "Reviews", href: "#testimonials" },
];

function scrollToSection(href: string) {
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;
  const top = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
}

export default function LeadsLandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavClick = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setMenuOpen(false);
    scrollToSection(href);
  };

  return (
    <>
      <nav aria-label="Leads navigation">
        <div className="nav-inner">
          <Link href="/" className="nav-logo home-brand-link" aria-label="Capital Lab Education home">
            <img src="/LOGO.PNG" alt="Capital Lab Education" className="logo-img" />
            <div className="logo-mark" style={{ display: "none" }}>CL</div>
            <span className="logo-text">
              <span className="brand-main">capital</span>
              <span className="brand-accent">lab</span>
            </span>
          </Link>

          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={handleNavClick(item.href)}>
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#contact-form" className="nav-cta" onClick={handleNavClick("#contact-form")}>
                Book free call
              </a>
            </li>
          </ul>

          <button
            className="leads-menu-btn"
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen ? "true" : "false"}
            aria-controls="leadsReactMobileNav"
            onClick={() => setMenuOpen((current) => !current)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <a href="#contact-form" className="nav-cta nav-cta-mobile" onClick={handleNavClick("#contact-form")}>
            Book free call
          </a>
        </div>
      </nav>

      <div
        id="leadsReactMobileNav"
        className={`leads-mobile-nav${menuOpen ? " open" : ""}`}
        aria-hidden={menuOpen ? "false" : "true"}
      >
        <div className="leads-mobile-nav__header">
          <Link href="/" className="nav-logo home-brand-link" onClick={() => setMenuOpen(false)}>
            <img src="/LOGO.PNG" alt="Capital Lab Education" className="logo-img" />
            <div className="logo-mark" style={{ display: "none" }}>CL</div>
            <span className="logo-text">
              <span className="brand-main">capital</span>
              <span className="brand-accent">lab</span>
            </span>
          </Link>
          <button
            className="leads-mobile-nav__close"
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            &times;
          </button>
        </div>

        <div className="leads-mobile-nav__links">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={handleNavClick(item.href)}>
              {item.label}
            </a>
          ))}
          <a href="#contact-form" className="nav-cta" onClick={handleNavClick("#contact-form")}>
            Book free call
          </a>
        </div>
      </div>
    </>
  );
}
