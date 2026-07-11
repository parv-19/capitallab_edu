"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";
import { useCfaLeadModal } from "@/contexts/CfaLeadModalContext";
import { companyInfo } from "@/lib/site-content";

const navLinks = [
  { label: "About", href: "#cfa-about" },
  { label: "Syllabus", href: "#cfa-syllabus" },
  { label: "Why CFA", href: "#cfa-why-cfa" },
  { label: "Mentor", href: "#cfa-mentor" },
  { label: "Testimonials", href: "#cfa-testimonials" },
  { label: "FAQ", href: "#cfa-faq" },
];

function CallButton({ className = "" }: { className?: string }) {
  return (
    <div className={`group relative ${className}`}>
      <a
        href={companyInfo.phoneHref}
        aria-label={`Call ${companyInfo.phoneDisplay}`}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-cfa-gold/10 text-cfa-gold transition-colors hover:bg-cfa-gold/20"
      >
        {[0, 0.35].map((delay) => (
          <motion.span
            key={delay}
            aria-hidden
            className="absolute inset-0 rounded-full bg-cfa-gold/50"
            animate={{ scale: [1, 2.1], opacity: [0.6, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 2,
              delay,
              ease: "easeOut",
            }}
          />
        ))}
        <motion.span
          className="relative z-10 flex"
          animate={{ rotate: [0, -26, 24, -20, 18, -12, 8, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut",
          }}
        >
          <Phone className="h-7 w-7" fill="currentColor" strokeWidth={1.5} />
        </motion.span>
      </a>
      <span className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded-sm border border-cfa-gold/30 bg-cfa-navy px-3.5 py-2 text-base font-medium text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        {companyInfo.phoneDisplay}
      </span>
    </div>
  );
}

export default function CfaNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { openModal } = useCfaLeadModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header>
      <div
        className={`fixed left-0 right-0 top-0 z-50 border-b border-cfa-gold/25 bg-cfa-navy transition-shadow duration-300 ${
          scrolled ? "shadow-lg shadow-black/20" : ""
        }`}
      >
      <div className="container flex h-24 items-center justify-between">
        <Link href="/lp-cfa" className="flex items-center gap-3">
          <Image
            src="/api/site-assets/logo"
            alt="Capital Lab Education"
            width={200}
            height={200}
            priority
            className="h-14 w-auto rounded-sm bg-white p-1.5 sm:h-16 md:h-20"
          />
          <span className="inline-flex items-center gap-1 font-jakarta text-3xl font-bold leading-relaxed tracking-tight text-white">
            <span>Capital</span>
            <span className="text-cfa-gold">Lab</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm px-4 py-2 text-xl font-medium leading-loose text-white/80 transition-colors hover:text-cfa-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <CallButton />
          <CfaCtaButton action="modal">Inquiry Now</CfaCtaButton>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <motion.button
            type="button"
            aria-label="Open inquiry form"
            onClick={openModal}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cfa-gold text-cfa-navy"
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
          <button
            className="p-2 text-white"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 top-24 z-40 flex h-[calc(100vh-6rem)] flex-col overflow-y-auto bg-cfa-navy lg:hidden"
          >
            <div className="container flex flex-1 flex-col justify-center gap-2 py-8">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  className="rounded-sm px-4 py-4 text-2xl font-medium leading-loose text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
                <CallButton />
                <CfaCtaButton
                  action="modal"
                  onBeforeAction={() => setMenuOpen(false)}
                  className="flex-1"
                >
                  Inquiry Now
                </CfaCtaButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </header>
  );
}
