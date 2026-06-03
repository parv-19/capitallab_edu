"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "About Us", href: "/#about-us" },
  { label: "CMA US", href: "/#cma-program" },
  { label: "CFA", href: "/#cfa-program" },
  { label: "Instructor", href: "/#instructor" },
  { label: "Testimonials", href: "/#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  const navBg = scrolled ? "bg-brand-navy shadow-lg" : "bg-brand-navy";

  const dashboardHref = user?.role === "admin" ? "/admin" : "/student";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b-2 border-brand-gold transition-all duration-300 ${navBg}`}
    >
      <div className="container-shell flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/api/site-assets/logo"
            alt="Capital Lab Education"
            className="h-10 w-auto rounded-sm bg-white p-1"
          />
          <span className="inline-flex items-center gap-1 text-[17px] font-extrabold lowercase tracking-[-0.04em] text-white">
            <span>capital</span>
            <span className="text-brand-gold">lab</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = link.href === "/#testimonials" ? pathname === "/testimonials" : false;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-brand-gold" : "text-white/80 hover:text-brand-gold"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-sm font-medium"
              >
                <div className="w-7 h-7 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4 text-brand-navy" />
                    My Dashboard
                  </Link>
                  <button
                    onClick={async () => { setDropdownOpen(false); await logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-white/40 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Login
            </Link>
          )}
          <Link
            href="/leads"
            className="rounded-md border border-brand-gold px-5 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold hover:text-brand-navy"
          >
            Book Free Call
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="p-2 text-white md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-white/10 bg-brand-navy md:hidden">
          <div className="container-shell flex flex-col gap-1 py-4">
            {navLinks.map((link) => {
              const isActive = link.href === "/#testimonials" ? pathname === "/testimonials" : false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? "bg-white/5 text-brand-gold" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-white/10 mt-2 pt-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    My Dashboard
                  </Link>
                  <button
                    onClick={async () => { setMenuOpen(false); await logout(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/10 rounded-lg"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="mb-3 block rounded-lg border border-white/30 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10"
                >
                  Login
                </Link>
              )}
              <Link
                href="/leads"
                className="block rounded-lg border border-brand-gold px-4 py-3 text-center text-sm font-semibold text-brand-gold hover:bg-brand-gold hover:text-brand-navy"
              >
                Book Free Call
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
