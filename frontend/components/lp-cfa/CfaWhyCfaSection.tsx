"use client";

import { motion } from "framer-motion";
import {
  Award,
  Briefcase,
  Globe,
  Sprout,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

interface Reason {
  icon: LucideIcon;
  title: string;
  description: string;
}

const reasons: Reason[] = [
  {
    icon: Award,
    title: "Designed to Complement Your Degree",
    description:
      "Pursue the CFA Program alongside your graduation to strengthen your profile early in your career journey.",
  },
  {
    icon: Users,
    title: "Open to All Academic Backgrounds",
    description:
      "Students from any stream can pursue CFA, making it accessible regardless of your undergraduate degree.",
  },
  {
    icon: Target,
    title: "Differentiate Yourself in Competitive Markets",
    description:
      "Stand out from the crowd with a globally valued credential that signals strong analytical expertise.",
  },
  {
    icon: Globe,
    title: "Global Recognition",
    description:
      "The CFA Program is respected worldwide, opening doors to opportunities across international financial markets.",
  },
  {
    icon: Briefcase,
    title: "Broad Industry Demand",
    description:
      "CFA professionals are sought after across investment firms, banks, corporates, and fintech companies.",
  },
  {
    icon: Sprout,
    title: "Stronger Earning Potential",
    description:
      "Build a career path that offers competitive compensation and long-term financial growth.",
  },
];

function DotGrid({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <defs>
        <pattern
          id="whyCfaDots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#whyCfaDots)" />
    </svg>
  );
}

function ReasonCard({ reason, index }: { reason: Reason; index: number }) {
  const Icon = reason.icon;
  const isNavy = index % 2 === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.1, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="relative pt-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: false }}
        transition={{
          duration: 0.5,
          ease: "backOut",
          delay: (index % 3) * 0.1 + 0.15,
        }}
        className="absolute right-[45%] top-0 z-10 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-2xl bg-cfa-gold shadow-lg shadow-cfa-gold/30"
      >
        <Icon className="h-8 w-8 text-white" strokeWidth={1.75} />
      </motion.div>

      <div
        className={`h-full rounded-3xl p-8 pt-14 text-center shadow-soft transition-shadow duration-300 hover:shadow-xl ${
          isNavy ? "bg-cfa-navy" : "bg-cfa-cream"
        }`}
      >
        <h3
          className={`font-jakarta text-xl font-bold leading-snug md:text-2xl ${
            isNavy ? "text-white" : "text-cfa-navy"
          }`}
        >
          {reason.title}
        </h3>
        <p
          className={`mt-3 text-base leading-relaxed md:text-lg ${
            isNavy ? "text-white/70" : "text-gray-600"
          }`}
        >
          {reason.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function CfaWhyCfaSection() {
  return (
    <section
      id="cfa-why-cfa"
      className="relative overflow-hidden bg-white py-20 md:py-28"
    >
      <DotGrid className="pointer-events-none absolute -left-10 top-16 h-40 w-40 text-cfa-gold/15" />
      <DotGrid className="pointer-events-none absolute -right-6 bottom-16 h-32 w-32 text-cfa-navy/10" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
            Make The Case
          </p>
          <h2 className="font-jakarta text-3xl font-bold leading-snug text-cfa-navy md:text-5xl">
            Why Should You Do <span className="text-cfa-gold">CFA?</span>
          </h2>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => (
            <ReasonCard key={reason.title} reason={reason} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mt-14 flex justify-center"
        >
          <CfaCtaButton action="modal" size="lg">
            Inquire About CFA Program
          </CfaCtaButton>
        </motion.div>
      </div>
    </section>
  );
}
