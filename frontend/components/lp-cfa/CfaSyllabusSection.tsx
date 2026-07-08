"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Briefcase, CheckCircle2, LineChart } from "lucide-react";

function withWeightRatio<T extends { weight: string }>(topics: T[]) {
  const averages = topics.map((topic) => {
    const numbers = topic.weight.match(/\d+/g)?.map(Number) ?? [0];
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  });
  const max = Math.max(...averages);
  return topics.map((topic, index) => ({
    ...topic,
    ratio: max ? Math.round((averages[index] / max) * 100) : 0,
  }));
}

const levels = [
  {
    label: "Level I",
    tag: "Foundations",
    icon: LineChart,
    description:
      "Focuses on core investment tools and concepts - ethics, financial statement analysis, equity, fixed income, quantitative methods, economics, derivatives, alternatives, and portfolio basics.",
    topics: withWeightRatio([
      { name: "Quantitative Methods", weight: "8-12%" },
      { name: "Economics", weight: "8-12%" },
      { name: "Financial Statement Analysis", weight: "13-17%" },
      { name: "Corporate Issuers", weight: "8-12%" },
      { name: "Equity Investments", weight: "10-12%" },
      { name: "Fixed Income", weight: "10-12%" },
      { name: "Derivatives", weight: "5-8%" },
      { name: "Alternative Investments", weight: "7-10%" },
      { name: "Portfolio Management", weight: "8-12%" },
      { name: "Ethical and Professional Standards", weight: "15-20%" },
    ]),
  },
  {
    label: "Level II",
    tag: "Application",
    icon: BarChart3,
    description:
      "Moves into deeper valuation and application of investment analysis principles across asset classes, with a strong emphasis on case-based, applied problem solving.",
    topics: withWeightRatio([
      { name: "Quantitative Methods", weight: "5-10%" },
      { name: "Economics", weight: "5-10%" },
      { name: "Financial Statement Analysis", weight: "10-15%" },
      { name: "Corporate Issuers", weight: "5-10%" },
      { name: "Equity Valuation", weight: "10-15%" },
      { name: "Fixed Income", weight: "10-15%" },
      { name: "Derivatives", weight: "5-10%" },
      { name: "Alternative Investments", weight: "5-10%" },
      { name: "Portfolio Management", weight: "10-15%" },
      { name: "Ethical and Professional Standards", weight: "10-15%" },
    ]),
  },
  {
    label: "Level III",
    tag: "Portfolio Management",
    icon: Briefcase,
    description:
      "Centers on portfolio management, asset allocation, risk, performance, and advanced decision-making for real-world investment mandates.",
    topics: withWeightRatio([
      { name: "Asset Allocation", weight: "15-20%" },
      { name: "Portfolio Construction", weight: "15-20%" },
      { name: "Performance Measurement", weight: "5-10%" },
      { name: "Derivatives and Risk Management", weight: "10-15%" },
      { name: "Equity and Fixed Income", weight: "10-15%" },
      { name: "Ethical and Professional Standards", weight: "10-15%" },
    ]),
  },
];

function TopicsPanel({ level }: { level: (typeof levels)[number] }) {
  return (
    <>
      <p className="mb-6 text-lg leading-relaxed text-gray-600 md:text-xl">
        {level.description}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {level.topics.map((topic, index) => (
          <motion.div
            key={topic.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
            whileHover={{ y: -3 }}
            className="rounded-xl bg-white px-4 py-3.5 shadow-sm transition-shadow duration-300 hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 text-base font-medium text-cfa-navy sm:text-lg">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cfa-gold" />
                {topic.name}
              </span>
              <span className="whitespace-nowrap text-base font-semibold text-cfa-gold">
                {topic.weight}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cfa-goldPale">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${topic.ratio}%` }}
                transition={{
                  duration: 0.6,
                  delay: 0.1 + index * 0.05,
                  ease: "easeOut",
                }}
                className="h-full rounded-full bg-gradient-to-r from-cfa-gold to-cfa-goldLight"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}

const NAV_OFFSET = 112;

export default function CfaSyllabusSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [minHeight, setMinHeight] = useState<number>();
  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const columnRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tabsStyle, setTabsStyle] = useState<CSSProperties>({});
  const active = levels[activeIndex];
  const ActiveIcon = active.icon;

  useLayoutEffect(() => {
    const computeMax = () => {
      const heights = measureRefs.current.map((el) => el?.offsetHeight ?? 0);
      setMinHeight(Math.max(...heights));
    };
    computeMax();
    window.addEventListener("resize", computeMax);
    return () => window.removeEventListener("resize", computeMax);
  }, []);

  useEffect(() => {
    let frame = 0;
    let targetOffset = 0;
    let renderedOffset = 0;
    let ticking = false;

    const computeTarget = () => {
      const column = columnRef.current;
      const tabs = tabsRef.current;
      if (!column || !tabs || window.innerWidth < 1024) {
        targetOffset = 0;
        return;
      }

      const scrollY = window.scrollY;
      const columnTop = column.getBoundingClientRect().top + scrollY;
      const maxOffset = Math.max(column.offsetHeight - tabs.offsetHeight, 0);
      const raw = scrollY - (columnTop - NAV_OFFSET);
      targetOffset = Math.min(Math.max(raw, 0), maxOffset);
    };

    const render = () => {
      ticking = false;
      renderedOffset += (targetOffset - renderedOffset) * 0.22;
      if (Math.abs(targetOffset - renderedOffset) < 0.5) {
        renderedOffset = targetOffset;
      }
      setTabsStyle({
        transform:
          window.innerWidth < 1024
            ? undefined
            : `translate3d(0, ${renderedOffset}px, 0)`,
        willChange: "transform",
      });
      if (renderedOffset !== targetOffset) {
        frame = requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    const schedule = () => {
      computeTarget();
      if (!ticking) {
        ticking = true;
        if (!frame) frame = requestAnimationFrame(render);
      }
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section id="cfa-syllabus" className="bg-white py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
            Curriculum Breakdown
          </p>
          <h2 className="font-jakarta text-3xl font-bold leading-snug text-cfa-navy md:text-5xl">
            CFA Course Syllabus
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:mt-5 sm:text-xl">
            The CFA program builds progressively across three levels - from
            foundational investment tools to deep valuation skills and finally
            full portfolio management thinking.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-8">
          {/* Below lg: compact tab bar */}
          <div className="flex gap-2 lg:hidden">
            {levels.map((level, index) => {
              const isActive = index === activeIndex;
              const Icon = level.icon;
              return (
                <button
                  key={level.label}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`relative flex flex-1 flex-col items-center gap-1.5 overflow-hidden rounded-xl px-2 py-3 text-center transition-colors duration-300 ${
                    isActive
                      ? "bg-cfa-navy text-white shadow-lg"
                      : "border border-gray-200 bg-white text-cfa-navy"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="syllabus-active-bar-mobile"
                      className="absolute inset-x-0 top-0 h-1 bg-cfa-gold"
                    />
                  )}
                  <Icon
                    className={`h-5 w-5 ${isActive ? "text-cfa-goldLight" : "text-cfa-gold"}`}
                  />
                  <span className="font-jakarta text-sm font-bold">
                    {level.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* lg and up: sticky detailed list */}
          <div ref={columnRef} className="relative hidden lg:block">
            <div ref={tabsRef} style={tabsStyle} className="lg:absolute lg:inset-x-0 lg:top-0">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col gap-3"
            >
              {levels.map((level, index) => {
                const isActive = index === activeIndex;
                const Icon = level.icon;
                return (
                  <button
                    key={level.label}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl px-6 py-5 text-left transition-colors duration-300 ${
                      isActive
                        ? "bg-cfa-navy text-white shadow-lg"
                        : "border border-gray-200 bg-white text-cfa-navy hover:border-cfa-gold/50"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="syllabus-active-bar"
                        className="absolute inset-y-0 left-0 w-1.5 bg-cfa-gold"
                      />
                    )}
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        isActive ? "bg-white/10" : "bg-cfa-gold/10"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${isActive ? "text-cfa-goldLight" : "text-cfa-gold"}`}
                      />
                    </span>
                    <span>
                      <span className="block font-jakarta text-xl font-bold sm:text-2xl">
                        {level.label}
                      </span>
                      <span
                        className={`mt-0.5 block text-sm font-medium sm:text-base ${
                          isActive ? "text-white/70" : "text-gray-400"
                        }`}
                      >
                        {level.tag}
                      </span>
                    </span>
                  </button>
                );
              })}
            </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-gray-100 bg-cfa-cream/50 p-6 sm:p-8"
            style={{ minHeight }}
          >
            <ActiveIcon
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 text-cfa-navy/[0.04]"
              strokeWidth={1}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={active.label}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative"
              >
                <TopicsPanel level={active} />
              </motion.div>
            </AnimatePresence>

            <div
              aria-hidden
              className="invisible absolute inset-6 -z-10 sm:inset-8"
            >
              {levels.map((level, index) => (
                <div
                  key={level.label}
                  ref={(el) => {
                    measureRefs.current[index] = el;
                  }}
                >
                  <TopicsPanel level={level} />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
