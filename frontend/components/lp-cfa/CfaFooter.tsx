"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { companyInfo } from "@/lib/site-content";

const sectionLinks = [
  { label: "About Capital Lab", href: "#cfa-about" },
  { label: "Why CFA", href: "#cfa-why-cfa" },
  { label: "Syllabus", href: "#cfa-syllabus" },
  { label: "Mentor", href: "#cfa-mentor" },
  { label: "Testimonials", href: "#cfa-testimonials" },
  { label: "FAQ", href: "#cfa-faq" },
];

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.554 4.106 1.523 5.828L.057 23.5l5.83-1.527A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.583-.502-5.073-1.377l-.364-.215-3.77.988.988-3.699-.234-.381A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

export default function CfaFooter() {
  return (
    <footer className="rounded-tl-[4rem] rounded-tr-[4rem] bg-cfa-navy text-white">
      <div className="container py-12 lg:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={fadeUp}
          className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/api/site-assets/logo"
                alt="Capital Lab Education"
                width={200}
                height={200}
                priority
                className="h-36 w-auto rounded-sm bg-white p-1.5"
              />
            </div>
            <p className="text-xl leading-relaxed text-white/60">
              {companyInfo.tagline}
            </p>
          </div>

          <div>
            <h3 className="mb-5 font-jakarta text-xl font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>
            <ul className="space-y-3">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-lg text-white/60 transition-colors hover:text-cfa-gold"
                  >
                    <span className="h-px w-0 bg-cfa-gold transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 font-jakarta text-xl font-semibold uppercase tracking-wider text-white">
              Office Hours
            </h3>
            <p className="text-lg text-white/60">{companyInfo.officeHours}</p>
          </div>

          <div>
            <h3 className="mb-5 font-jakarta text-xl font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-lg text-white/60">
                <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-cfa-gold" />
                <a
                  href={companyInfo.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-cfa-gold"
                >
                  {companyInfo.location}
                </a>
              </li>
              <li className="flex items-center gap-3 text-lg text-white/60">
                <Phone className="h-6 w-6 shrink-0 text-cfa-gold" />
                <a
                  href={companyInfo.phoneHref}
                  className="transition-colors hover:text-cfa-gold"
                >
                  {companyInfo.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3 text-lg text-white/60">
                <Mail className="h-6 w-6 shrink-0 text-cfa-gold" />
                <a
                  href={`mailto:${companyInfo.email}`}
                  className="transition-colors hover:text-cfa-gold"
                >
                  {companyInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-lg text-white/60">
                <WhatsAppIcon className="h-6 w-6 shrink-0 fill-cfa-gold" />
                <a
                  href={companyInfo.whatsappHref}
                  className="transition-colors hover:text-cfa-gold"
                >
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>
        </motion.div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-2 py-8 pb-24 text-lg text-white/40 sm:flex-row md:pb-8">
          <span>&copy; 2026 {companyInfo.name}. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a
              href="/privacy"
              className="transition-colors hover:text-white/70"
            >
              Privacy Policy
            </a>
            <a href="/terms" className="transition-colors hover:text-white/70">
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
