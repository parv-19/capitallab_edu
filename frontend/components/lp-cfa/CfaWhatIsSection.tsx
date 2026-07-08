"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  Layers,
  TrendingUp,
  Users,
} from "lucide-react";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

const cfaCoreSkills = [
  "One of the most respected and globally recognized qualifications in the finance industry",
  "Builds deep expertise in investment analysis, valuation, and portfolio management",
  "Covers economics, fixed income, equity, and derivatives markets in depth",
  "Signals the technical depth and readiness employers seek for high-responsibility finance roles",
];

const whoShouldPursue = [
  {
    tag: "Working Professionals",
    detail: "Looking to upgrade analytical and portfolio skills",
  },
  {
    tag: "Students & Graduates",
    detail: "Entering investment and equity research careers",
  },
  { tag: "Career Changers", detail: "Making a deliberate move into finance" },
];

const careerPaths = [
  { role: "Financial Analyst", tier: "Entry-level", note: "Rs. 3-6 LPA" },
  {
    role: "Equity Research Associate",
    tier: "Entry-level",
    note: "Rs. 3-6 LPA",
  },
  {
    role: "Investment Banking Associate",
    tier: "Experienced",
    note: "Senior track",
  },
  { role: "Portfolio Manager", tier: "Experienced", note: "Senior track" },
];

function IconBadge({
  icon: Icon,
  tone,
}: {
  icon: typeof Users;
  tone: "gold" | "navy";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0.5, ease: "backOut", delay: 0.15 }}
      className={`absolute -top-4 left-5 flex h-9 w-9 items-center justify-center rounded-xl shadow-lg sm:-top-5 sm:left-8 sm:h-12 sm:w-12 sm:rounded-2xl ${
        tone === "gold" ? "bg-cfa-gold" : "bg-cfa-navy"
      }`}
    >
      <Icon className="h-4 w-4 text-white sm:h-6 sm:w-6" strokeWidth={2} />
    </motion.div>
  );
}

export default function CfaWhatIsSection() {
  return (
    <section
      id="cfa-what-is-cfa"
      className="relative overflow-hidden bg-cfa-lilac py-20 md:py-28"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cfa-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cfa-navy/10 blur-3xl" />

      <div className="container">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-4 text-center text-sm font-semibold uppercase tracking-[3px] text-cfa-gold"
        >
          Know The Credential
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="group relative mb-10 min-h-[440px] md:min-h-[500px]"
        >
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <motion.img
              src="/lp-cfa/whatiscfa-image.jpg"
              alt="Financial market candlestick chart analysis"
              className="absolute inset-0 h-full w-full scale-x-[-1] object-cover"
              initial={{ scale: 1.08 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-cfa-navy/80" />
            <div className="absolute inset-0 bg-gradient-to-t from-cfa-navy/95 via-cfa-navy/60 to-cfa-navy/60" />
          </div>

          <div className="relative flex h-full flex-col items-center justify-between gap-6 p-5 text-center sm:gap-8 sm:p-6 lg:min-h-[500px] lg:p-10">
            <div className="flex w-full items-start justify-between gap-4">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="inline-flex items-center gap-1.5 rounded-full bg-cfa-gold px-3 py-1.5 text-sm font-semibold text-white shadow-lg transition-transform duration-500 sm:gap-2 sm:px-4 sm:py-2 sm:text-lg lg:group-hover:-translate-y-16">
                  <Landmark className="h-4 w-4 text-white sm:h-6 sm:w-6" />
                  CFA Institute
                </div>
              </motion.div>
              <motion.span
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cfa-gold shadow-lg sm:h-9 sm:w-9"
              >
                <motion.span
                  animate={{ y: [0, -3, 0] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <TrendingUp className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                </motion.span>
              </motion.span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.4 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
              className="mx-auto w-full"
            >
              <h2 className="font-jakarta text-2xl font-bold leading-snug text-white text-center sm:text-3xl lg:text-8xl">
                What Is CFA?
              </h2>
              <div className="mt-5 flex flex-col items-start gap-3 text-left sm:mx-auto sm:max-w-7xl sm:gap-4 sm:py-4">
                {cfaCoreSkills.map((skill, index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.4 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.1 + index * 0.08,
                      ease: "easeOut",
                    }}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-white/85 sm:gap-3 sm:text-base lg:text-2xl"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cfa-gold lg:h-8 lg:w-8" />
                    {skill}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-3 border-t border-white/15 pt-5 sm:gap-4 sm:pt-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-16 sm:w-16">
                <Layers className="h-5 w-5 text-cfa-goldLight sm:h-8 sm:w-8" />
              </div>
              <div className="text-left">
                <div className="font-jakarta text-base font-bold text-white sm:text-xl">
                  3 Progressive Levels
                </div>
                <div className="text-sm text-white/60 sm:text-lg">
                  Foundations to Portfolio Mastery
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative rounded-3xl bg-cfa-navy p-5 pt-9 sm:p-8 sm:pt-10"
          >
            <IconBadge icon={Users} tone="gold" />

            <p className="mb-2 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
              Ideal For
            </p>
            <h3 className="mb-3 font-jakarta text-2xl font-bold text-white md:text-4xl">
              Who Should Pursue CFA?
            </h3>
            <p className="mb-6 text-base leading-relaxed text-white/70 md:text-lg">
              The program suits anyone building a serious career in investment
              analysis and capital markets - whether you&apos;re upgrading your
              skill set, starting fresh, or switching tracks entirely.
            </p>

            <div className="flex flex-col gap-3">
              {whoShouldPursue.map((item, index) => (
                <motion.div
                  key={item.tag}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.4 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors duration-300 hover:border-cfa-gold/50 hover:bg-white/10"
                >
                  <div className="text-base font-semibold text-cfa-goldLight">
                    {item.tag}
                  </div>
                  <div className="mt-1 text-sm leading-snug text-white/60">
                    {item.detail}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="relative rounded-3xl border border-cfa-goldPale bg-white p-5 pt-9 sm:p-8 sm:pt-10"
          >
            <IconBadge icon={TrendingUp} tone="navy" />

            <p className="mb-2 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
              Where It Leads
            </p>
            <h3 className="mb-3 font-jakarta text-2xl font-bold text-cfa-navy md:text-4xl">
              Career Opportunities
            </h3>
            <p className="mb-6 text-base leading-relaxed text-gray-600 md:text-lg">
              From your first analyst role to leading a portfolio desk, the
              charter opens doors across research, banking, and asset
              management.
            </p>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Entry-level
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {careerPaths
                    .filter((item) => item.tier === "Entry-level")
                    .map((item, index) => (
                      <motion.div
                        key={item.role}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.4 }}
                        transition={{
                          duration: 0.5,
                          delay: index * 0.1,
                          ease: "easeOut",
                        }}
                        className="flex items-center justify-between gap-2 rounded-xl bg-cfa-cream px-4 py-2.5"
                      >
                        <span className="text-base font-semibold text-cfa-navy">
                          {item.role}
                        </span>
                        <span className="whitespace-nowrap text-sm text-gray-500">
                          {item.note}
                        </span>
                      </motion.div>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-gray-400">
                  <ArrowRight className="h-3.5 w-3.5 text-cfa-gold" />
                  Experienced
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {careerPaths
                    .filter((item) => item.tier === "Experienced")
                    .map((item, index) => (
                      <motion.div
                        key={item.role}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.4 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.2 + index * 0.1,
                          ease: "easeOut",
                        }}
                        className="flex items-center justify-between gap-2 rounded-xl bg-cfa-navy/5 px-4 py-2.5"
                      >
                        <span className="text-base font-semibold text-cfa-navy">
                          {item.role}
                        </span>
                        <span className="whitespace-nowrap text-sm text-gray-500">
                          {item.note}
                        </span>
                      </motion.div>
                    ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mt-12 flex justify-center"
        >
          <CfaCtaButton action="modal" size="lg">
            Inquire About CFA Program
          </CfaCtaButton>
        </motion.div>
      </div>
    </section>
  );
}
