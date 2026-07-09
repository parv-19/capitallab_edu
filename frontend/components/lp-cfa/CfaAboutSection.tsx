"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Award, CheckCircle2 } from "lucide-react";
import { companyInfo } from "@/lib/site-content";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

const quickFacts = [
  { highlight: "10+ years", text: "of finance coaching experience" },
  { highlight: "500+ students", text: "mentored across CMA US & CFA" },
  { highlight: "Small batches", text: "with personal mentorship" },
  { highlight: "Practical, industry-linked", text: "curriculum" },
];

const headingRevealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

const underlineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1, ease: "easeInOut", delay: 0.3 },
  },
} as const;

function PencilUnderline() {
  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full overflow-visible"
    >
      <motion.path
        d="M2 14 C 40 4, 80 18, 120 8 C 150 2, 175 14, 198 6"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="6"
        strokeLinecap="round"
        variants={underlineVariants}
      />
    </svg>
  );
}

function AnimatedCheck() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cfa-gold">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        overflow="visible"
      >
        <motion.path
          d="M4 12.5 L9.5 18 L20 6"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ pathLength: [0, 1, 1, 0] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.35, 0.85, 1],
          }}
        />
      </svg>
    </div>
  );
}

function DotGrid({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <defs>
        <pattern
          id="cfaAboutDots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.6" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#cfaAboutDots)" />
    </svg>
  );
}

export default function CfaAboutSection() {
  return (
    <section
      id="cfa-about"
      className="relative overflow-hidden bg-white py-20 md:py-28"
    >
      <DotGrid className="pointer-events-none absolute -left-10 top-10 h-40 w-40 text-cfa-gold/15" />
      <DotGrid className="pointer-events-none absolute -right-6 bottom-10 h-32 w-32 text-cfa-navy/10" />

      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.4 }}
          variants={headingRevealVariants}
          className="mx-auto mb-16 max-w-4xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
            About Capital Lab
          </p>

          <h3 className="font-jakarta text-3xl font-bold leading-snug text-cfa-navy md:text-5xl">
            We Don&apos;t Just Teach The CFA Syllabus, We Build The{" "}
            <span className="relative inline-block whitespace-nowrap text-cfa-gold">
              Careers Behind It
              <PencilUnderline />
            </span>
          </h3>
        </motion.div>
      </div>

      <div className="container grid items-stretch gap-16 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="group relative mx-auto h-full w-full max-w-2xl lg:mx-0"
        >
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl bg-cfa-gold/90 transition-transform duration-500 ease-out group-hover:translate-x-4 group-hover:translate-y-4"
          />
          <motion.div
            aria-hidden
            className="absolute -left-8 -top-8 h-28 w-28 rounded-full border-2 border-dashed border-cfa-navy/25"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative h-full min-h-[320px] overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src="/lp-cfa/about-image.png"
              alt="Capital Lab Education finance coaching"
              fill
              className="object-cover"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute -top-5 left-6 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-cfa-navy shadow-lg"
          >
            <Award className="h-4 w-4 text-cfa-gold" />
            CFA Institute Recognized
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="absolute -bottom-6 -right-6 rounded-2xl bg-cfa-navy px-6 py-4 text-center text-white shadow-xl"
          >
            <div className="font-jakarta text-3xl font-bold text-cfa-gold">
              10+
            </div>
            <div className="text-xs text-white/70">Years of Excellence</div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="mb-5 w-full font-jakarta text-2xl font-semibold leading-snug text-gray-700 sm:text-3xl">
            {companyInfo.aboutHeadline}
          </h2>

          <p className="mb-8 w-full text-lg font-medium leading-relaxed tracking-normal text-gray-600 sm:text-xl">
            Capital Lab Education is a{" "}
            <span className="font-semibold text-cfa-navy">
              specialized coaching institute
            </span>{" "}
            focused exclusively on professional finance certifications. We
            combine deep industry expertise with{" "}
            <span className="font-semibold text-cfa-gold">
              structured, exam-focused learning
            </span>
            , helping working professionals and students crack{" "}
            <span className="font-semibold text-cfa-navy">
              globally recognized credentials
            </span>{" "}
            with confidence.
          </p>

          <ul className="mb-8 w-full space-y-4">
            {quickFacts.map((fact, index) => (
              <motion.li
                key={fact.highlight}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.4 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.12,
                  ease: "easeOut",
                }}
                className="flex items-center gap-3 text-lg text-gray-700 sm:text-xl"
              >
                {index === 0 ? (
                  <AnimatedCheck />
                ) : (
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-cfa-gold" />
                )}
                <span className="leading-snug">
                  <span className="font-semibold text-cfa-gold">
                    {fact.highlight}
                  </span>{" "}
                  {fact.text}
                </span>
              </motion.li>
            ))}
          </ul>

          <CfaCtaButton action="modal" size="md">
            Inquire Now
          </CfaCtaButton>
        </motion.div>
      </div>
    </section>
  );
}
