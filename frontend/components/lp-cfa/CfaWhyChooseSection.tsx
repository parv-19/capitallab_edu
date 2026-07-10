"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  ChevronDown,
  ClipboardCheck,
  MonitorPlay,
  Route,
  Users2,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
}

const features: Feature[] = [
  {
    icon: Route,
    title: "Structured 9-Month Roadmap",
    description:
      "A clear month-by-month path from fundamentals to full syllabus coverage, so you always know exactly what comes next.",
    image: "/lp-cfa/why-roadmap.png",
  },
  {
    icon: UserCheck,
    title: "Experienced Mentor",
    description:
      "Learn directly from a mentor who explains complex topics with practical, real-world context - not just theory.",
    image: "/instructur_harsh_new.jpeg",
  },
  {
    icon: MonitorPlay,
    title: "LMS Support",
    description:
      "Recorded lectures, quizzes, and progress tracking so you can revise anytime, anywhere, at your own pace.",
    image: "/lp-cfa/why-lms.png",
  },
  {
    icon: Users2,
    title: "Offline Classroom",
    description:
      "In-person sessions that enable real peer learning and immediate doubt resolution, not isolated study.",
    image: "/lp-cfa/why-classroom.png",
  },
  {
    icon: ClipboardCheck,
    title: "Full Mock Tests",
    description:
      "Complete mock exams that build confidence and simulate real exam-day conditions before the big day.",
    image: "/lp-cfa/why-mocktests.png",
  },
  {
    icon: Award,
    title: "Career Support",
    description:
      "Excel training, interview preparation, and placement guidance to help you actually launch your career.",
    image: "/lp-cfa/why-career.png",
  },
];

export default function CfaWhyChooseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openMobileIndex, setOpenMobileIndex] = useState<number | null>(0);
  const active = features[activeIndex];

  return (
    <section
      id="cfa-why-choose"
      className="relative overflow-hidden bg-cfa-lilac py-16 md:py-28"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cfa-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cfa-navy/10 blur-3xl" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-10 max-w-3xl text-center lg:mb-14"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[3px] text-cfa-gold sm:text-sm">
            The Capital Lab Edge
          </p>
          <h2 className="font-jakarta text-2xl font-bold leading-snug text-cfa-navy sm:text-3xl md:text-5xl">
            Why Choose <span className="text-cfa-gold">Capital Lab?</span>
          </h2>
        </motion.div>

        {/* Below lg: accordion */}
        <div className="flex flex-col gap-3 lg:hidden">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isOpen = openMobileIndex === index;
            return (
              <div
                key={feature.title}
                className="overflow-hidden rounded-2xl bg-white shadow-soft"
              >
                <button
                  type="button"
                  onClick={() => setOpenMobileIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                      isOpen ? "bg-cfa-gold" : "bg-cfa-navy/5"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors duration-300 ${
                        isOpen ? "text-white" : "text-cfa-navy"
                      }`}
                    />
                  </span>
                  <span className="flex-1 font-jakarta text-base font-bold text-cfa-navy">
                    {feature.title}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="h-5 w-5 shrink-0 text-cfa-gold" />
                  </motion.span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4">
                      <div className="relative mb-3 h-64 w-full overflow-hidden rounded-xl md:h-40">
                        <Image
                          src={feature.image}
                          alt={feature.title}
                          fill
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-cfa-navy/60 via-transparent to-transparent" />
                      </div>
                      <p className="text-sm leading-relaxed text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* lg and up: interactive list + image panel */}
        <div className="hidden gap-14 lg:grid lg:grid-cols-[1fr_1.1fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col gap-3"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === activeIndex;
              return (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`group relative flex items-start gap-4 overflow-hidden rounded-2xl px-5 py-4 text-left transition-all duration-300 ${
                    isActive
                      ? "bg-cfa-navy shadow-lg"
                      : "bg-white/60 hover:bg-white"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="why-choose-bar"
                      className="absolute inset-y-0 left-0 w-1.5 bg-cfa-gold"
                    />
                  )}
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                      isActive
                        ? "bg-cfa-gold"
                        : "bg-cfa-navy/5 group-hover:bg-cfa-gold/10"
                    }`}
                  >
                    <Icon
                      className={`h-8 w-8 transition-colors duration-300 ${
                        isActive ? "text-white" : "text-cfa-navy"
                      }`}
                    />
                  </span>
                  <span>
                    <span
                      className={`block font-jakarta text-xl font-bold ${
                        isActive ? "text-white" : "text-cfa-navy"
                      }`}
                    >
                      {feature.title}
                    </span>
                    <span
                      className={`mt-1 block text-base leading-relaxed ${
                        isActive ? "text-white/70" : "text-gray-500"
                      }`}
                    >
                      {feature.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="relative min-h-full overflow-hidden rounded-3xl shadow-2xl"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={active.image}
                src={active.image}
                alt={active.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-cfa-navy/90 via-cfa-navy/10 to-transparent" />

            <AnimatePresence mode="wait">
              <motion.div
                key={active.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-x-0 bottom-0 p-8"
              >
                <p className="font-jakarta text-2xl font-bold text-white">
                  {active.title}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
