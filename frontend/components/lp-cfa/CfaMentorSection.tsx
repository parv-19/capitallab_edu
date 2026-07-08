"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Award, BadgeCheck, Quote } from "lucide-react";
import { instructorProfile } from "@/lib/site-content";

const BLOB_PATH =
  "M39.9,-65.7C52.1,-60.1,62.5,-49.9,69.2,-37.4C75.9,-24.9,78.9,-9.9,77.6,4.7C76.3,19.3,70.7,33.5,61.8,45.3C52.9,57.1,40.7,66.5,26.9,71.6C13.1,76.7,-2.3,77.5,-16.9,74.1C-31.5,70.7,-45.3,63.1,-56.4,52.2C-67.5,41.3,-75.9,27.1,-78.9,11.7C-81.9,-3.7,-79.5,-20.3,-71.9,-33.7C-64.3,-47.1,-51.5,-57.3,-38,-63.4C-24.5,-69.5,-12.3,-71.5,1.2,-73.5C14.6,-75.5,29.2,-71.3,39.9,-65.7Z";

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

function MentorPortrait() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-xl">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id="mentorBlob" clipPathUnits="objectBoundingBox">
            <path transform="translate(0.5,0.5) scale(0.0052)" d={BLOB_PATH} />
          </clipPath>
        </defs>
      </svg>

      <motion.svg
        aria-hidden
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full text-cfa-gold/25"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <path
          transform="translate(210,208) scale(2.75)"
          d={BLOB_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 8"
        />
      </motion.svg>

      <Image
        src="/instructur_harsh_new.jpeg"
        alt="Harsh Trivedi, Founder and Lead Instructor at Capital Lab Education"
        fill
        sizes="(min-width: 1280px) 576px, 90vw"
        className="object-cover drop-shadow-2xl"
        style={{ clipPath: "url(#mentorBlob)", objectPosition: "50% 28%" }}
      />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute -left-4 top-8 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-cfa-navy shadow-lg sm:-left-8"
      >
        <Award className="h-4 w-4 text-cfa-gold" />
        CFA Level 2 Cleared
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="absolute -right-2 bottom-10 rounded-2xl bg-cfa-navy px-6 py-4 text-center text-white shadow-xl sm:-right-6"
      >
        <div className="font-jakarta text-3xl font-bold text-cfa-gold">10+</div>
        <div className="text-sm text-white/70">Years in Finance</div>
      </motion.div>
    </div>
  );
}

export default function CfaMentorSection() {
  return (
    <section
      id="cfa-mentor"
      className="relative overflow-hidden bg-cfa-cream py-20 md:py-28"
    >
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cfa-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cfa-navy/10 blur-3xl" />

      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.4 }}
          variants={headingRevealVariants}
          className="mx-auto mb-16 max-w-4xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
            Meet Your Instructor
          </p>
          <h2 className="font-jakarta text-3xl font-bold leading-snug text-cfa-navy md:text-5xl">
            Learn From Someone Who&apos;s{" "}
            <span className="relative inline-block whitespace-nowrap text-cfa-gold">
              Done It
              <PencilUnderline />
            </span>
          </h2>
        </motion.div>

        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <MentorPortrait />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            <h3 className="font-jakarta text-2xl font-bold text-cfa-navy md:text-3xl">
              Harsh Trivedi
            </h3>
            <p className="mt-1 text-lg font-medium text-cfa-gold">
              Founder &amp; Lead Instructor, Capital Lab Education
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {instructorProfile.credentials.map((credential) => (
                <span
                  key={credential}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cfa-goldPale bg-white px-3.5 py-1.5 text-sm font-semibold text-cfa-navy"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-cfa-gold" />
                  {credential}
                </span>
              ))}
            </div>

            <p className="mt-6 text-lg font-semibold leading-relaxed text-cfa-navy md:text-xl">
              Great finance professionals are built through exposure, judgment,
              and application - not memorization.
            </p>

            <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-600 md:text-lg">
              <p>
                With over a decade of hands-on experience across valuation,
                investment analysis, real estate financial modeling, credit
                analysis, and financial decision-making, Harsh brings
                institutional-level industry experience directly into the
                classroom.
              </p>
              <p>
                Sessions go beyond textbooks and exam preparation - focusing on
                structured thinking, commercial understanding, analytical rigor,
                and practical execution, so students learn to think like
                analysts, not just clear questions.
              </p>
            </div>

            <div className="mt-6 border-l-4 border-cfa-gold py-1 pl-5">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-400">
                At Capital Lab Education, the objective is simple
              </p>
              <p className="mt-1 text-lg font-semibold text-cfa-navy md:text-xl">
                Bridge the gap between academic knowledge and professional
                excellence.
              </p>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                Areas of Expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {instructorProfile.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-cfa-gold/25 bg-cfa-gold/5 px-3.5 py-1.5 text-sm font-medium text-cfa-navy"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="relative mt-8 overflow-hidden rounded-2xl bg-white p-6 sm:p-7 border border-cfa-goldPale"
            >
              <Quote
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-4 h-24 w-24 text-cfa-navy/[0.05]"
                strokeWidth={1}
              />
              <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-cfa-gold">
                Learning Philosophy
              </p>
              <p className="relative text-lg font-semibold leading-relaxed text-cfa-navy md:text-xl">
                Learn with context. Apply with confidence. Build a career - not
                just clear an exam.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
