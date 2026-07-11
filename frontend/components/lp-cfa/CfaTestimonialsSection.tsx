"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Star,
  Quote,
  Maximize2,
} from "lucide-react";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

// ─── Data ────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    id: "t1",
    name: "Rishabh Dayama",
    course: "Capital Lab Education Student",
    rating: 5,
    review:
      "Truly great faculty. Harsh Sir has in-depth subject knowledge and a highly engaging teaching style. He is focused on practical application and highly committed to students' progress. Excited for Capital Labs!",
    video: "/lp-cfa/videos/testimonial-rishabh-dayama.mp4",
  },
  {
    id: "t2",
    name: "Manya Patel",
    course: "Capital Lab Education Student",
    rating: 5,
    review:
      "Harsh Sir, you are truly one of the best teachers. Your guidance is exceptional, and your knowledge is truly inspiring. Your teaching style is so clear that we understand everything in just one explanation.",
    video: "/lp-cfa/videos/testimonial-manya-patel.mp4",
  },
  {
    id: "t3",
    name: "Vishal Sharma",
    course: "CFA Candidate – Capital Lab Education",
    rating: 5,
    review:
      "I'm really grateful to have you as my CFA mentor. Your ability to simplify complex concepts made a huge difference. It never felt like formal teaching — it felt like guidance from an elder brother who wants you to succeed.",
    video: "/lp-cfa/videos/testimonial-vishal-sharma.mp4",
  },
  {
    id: "t4",
    name: "Chhaya Shukla",
    course: "CFA Level 1 Student – Capital Lab Education",
    rating: 5,
    review:
      "Understanding finance took a downturn for me, but having learnt the concepts from basics by Harsh Sir brought huge confidence. His teaching made a real difference in my preparation.",
    video: "/lp-cfa/videos/testimonial-chhaya-shukla.mp4",
  },
];

const AUTO_SWITCH_DELAY = 6000;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Animation variants ───────────────────────────────────────────────────────

const EASE_SNAP = [0.22, 1, 0.36, 1] as const;

const wordContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};
const wordItem = {
  hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE_SNAP },
  },
};

// ─── Ripple play button ───────────────────────────────────────────────────────

function RipplePlayButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label="Play video"
      className="relative flex items-center justify-center"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 350, damping: 22 }}
    >
      {[0, 1].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full border-2 border-cfa-gold/50"
          style={{ width: 68, height: 68 }}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{
            duration: 2.2,
            delay: i * 1.1,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-cfa-gold text-cfa-navy shadow-[0_0_32px_rgba(201,168,76,0.55)]">
        <Play className="ml-1 h-7 w-7" fill="currentColor" />
      </span>
    </motion.button>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "md" | "sm";
}) {
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < rating
              ? "fill-cfa-gold text-cfa-gold"
              : "fill-white/20 text-white/20"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CfaTestimonialsSection() {
  const [activeId, setActiveId] = useState(TESTIMONIALS[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  const active = TESTIMONIALS.find((t) => t.id === activeId)!;

  // ── Auto-switch every 6 s when video is not playing ──
  useEffect(() => {
    if (isPlaying) return;
    const timer = setInterval(() => {
      setActiveId((cur) => {
        const idx = TESTIMONIALS.findIndex((t) => t.id === cur);
        return TESTIMONIALS[(idx + 1) % TESTIMONIALS.length].id;
      });
    }, AUTO_SWITCH_DELAY);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Reset playback state whenever active card changes
  useEffect(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
    setProgress(0);
  }, [activeId]);

  const handleSelect = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setActiveId(id);
    },
    [activeId],
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted((m) => !m);
  }, [isMuted]);

  const handleFullscreen = useCallback(() => {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  }, []);

  return (
    <section
      id="cfa-testimonials"
      className="relative overflow-hidden bg-cfa-navy py-20 md:py-28"
    >
      {/* Background glow orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/3 h-[500px] w-[500px] rounded-full bg-cfa-gold/[0.07] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-1/4 h-[500px] w-[500px] rounded-full bg-cfa-navyLight/60 blur-[120px]"
      />

      <div className="container relative z-10">
        {/* ── Heading ── */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.5, ease: EASE_SNAP }}
            className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold"
          >
            Student Success Stories
          </motion.p>

          <motion.h2
            variants={wordContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
            className="font-jakarta text-3xl font-bold leading-snug text-white md:text-5xl"
          >
            {(
              [
                { text: "Real", gold: false },
                { text: "Voices.", gold: false },
                { text: "Real", gold: true },
                { text: "Results.", gold: true },
              ] as const
            ).map(({ text, gold }, i) => (
              <motion.span
                key={i}
                variants={wordItem}
                className={`mr-[0.28em] inline-block ${gold ? "text-cfa-gold" : ""}`}
              >
                {text}
              </motion.span>
            ))}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.5, ease: EASE_SNAP, delay: 0.35 }}
            className="mt-4 text-base text-white/50"
          >
            Don&apos;t just take our word for it — hear directly from students
            who transformed their careers with Capital Lab.
          </motion.p>
        </div>

        {/* ── Body: featured player + selector reel ── */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          {/* ── Featured video player ── */}
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.65, ease: EASE_SNAP }}
            className="overflow-hidden rounded-2xl bg-black shadow-[0_24px_80px_rgba(0,0,0,0.55)] lg:flex lg:flex-col lg:h-full lg:max-h-[480px] lg:min-h-[700px]"
          >
            {/* Video area */}
            <div
              ref={playerRef}
              className="relative aspect-video lg:aspect-auto lg:flex-1 lg:min-h-0"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  className="h-full w-full"
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  <video
                    ref={videoRef}
                    src={active.video}
                    className="h-full w-full object-cover"
                    playsInline
                    preload="metadata"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                  />
                </motion.div>
              </AnimatePresence>

              {/* ── Paused overlay ── */}
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/75 via-black/25 to-black/10"
                >
                  <RipplePlayButton onClick={togglePlay} />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeId + "-name"}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, ease: EASE_SNAP }}
                      className="absolute bottom-5 left-5"
                    >
                      <p className="text-lg font-bold text-white">
                        {active.name}
                      </p>
                      <p className="text-sm text-cfa-gold">{active.course}</p>
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Playing overlay: center pause + bottom bar, both on hover ── */}
              {isPlaying && (
                <div className="group/ctrl absolute inset-0">
                  {/* Gradient for controls visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/ctrl:opacity-100" />

                  {/* Center pause button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/ctrl:opacity-100">
                    <motion.button
                      onClick={togglePlay}
                      aria-label="Pause"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 22,
                      }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                    >
                      <Pause className="h-7 w-7" fill="currentColor" />
                    </motion.button>
                  </div>

                  {/* Bottom controls bar */}
                  <div className="absolute bottom-0 left-0 right-0 translate-y-1 px-4 pb-4 pt-8 opacity-0 transition-all duration-300 group-hover/ctrl:translate-y-0 group-hover/ctrl:opacity-100">
                    {/* Seekable progress bar */}
                    <div
                      role="progressbar"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      onClick={handleSeek}
                      className="mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/25"
                    >
                      <div
                        className="h-full rounded-full bg-cfa-gold transition-[width] duration-100"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          aria-label="Pause"
                          className="text-white/80 transition-colors hover:text-cfa-gold"
                        >
                          <Pause className="h-5 w-5" fill="currentColor" />
                        </button>
                        <button
                          onClick={toggleMute}
                          aria-label={isMuted ? "Unmute" : "Mute"}
                          className="text-white/80 transition-colors hover:text-cfa-gold"
                        >
                          {isMuted ? (
                            <VolumeX className="h-5 w-5" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <button
                        onClick={handleFullscreen}
                        aria-label="Fullscreen"
                        className="text-white/80 transition-colors hover:text-cfa-gold"
                      >
                        <Maximize2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quote strip below video */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId + "-quote"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.38, ease: EASE_SNAP }}
                className="flex items-start gap-4 bg-cfa-navyMid px-6 py-6 lg:shrink-0"
              >
                <Quote
                  aria-hidden
                  className="mt-1 h-9 w-9 shrink-0 text-cfa-gold/40"
                  fill="currentColor"
                />
                <div className="min-w-0">
                  <p className="text-lg font-medium italic leading-relaxed text-white/75">
                    &ldquo;{active.review}&rdquo;
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cfa-gold/20 text-sm font-bold text-cfa-gold">
                      {initials(active.name)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {active.name}
                      </p>
                      <Stars rating={active.rating} size="sm" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── Selector reel ── */}
          <div className="flex flex-row gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {TESTIMONIALS.map((t, i) => {
              const isActive = t.id === activeId;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    ease: EASE_SNAP,
                    delay: i * 0.07 + 0.1,
                  }}
                  whileHover={!isActive ? { x: -5 } : {}}
                  // overflow-hidden clips the absolute left bar inside the rounded corners
                  className={`relative flex min-w-[260px] items-start gap-4 overflow-hidden rounded-2xl border p-5 text-left transition-colors duration-300 lg:min-w-0 ${
                    isActive
                      ? "border-cfa-gold/40 bg-white/10"
                      : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]"
                  }`}
                >
                  {/* Sliding gold left bar — clipped by overflow-hidden so it stays inside rounded corners */}
                  {isActive && (
                    <motion.span
                      layoutId="active-reel-indicator"
                      className="absolute inset-y-0 left-0 w-[3px] bg-cfa-gold"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 28,
                      }}
                    />
                  )}

                  {/* Auto-switch progress line at bottom of active card */}
                  {isActive && !isPlaying && (
                    <motion.span
                      key={activeId + "-auto-progress"}
                      aria-hidden
                      className="absolute bottom-0 left-0 h-[2px] rounded-full bg-cfa-gold/60"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: AUTO_SWITCH_DELAY / 1000,
                        ease: "linear",
                      }}
                    />
                  )}

                  {/* Avatar */}
                  <motion.div
                    animate={{
                      backgroundColor: isActive
                        ? "rgba(201,168,76,1)"
                        : "rgba(201,168,76,0.15)",
                      color: isActive ? "#0D1B3E" : "#C9A84C",
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold"
                  >
                    {initials(t.name)}
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <motion.p
                      animate={{
                        color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="truncate text-lg font-bold"
                    >
                      {t.name}
                    </motion.p>
                    <div className="mt-1">
                      <Stars rating={t.rating} size="md" />
                    </div>
                    <motion.p
                      animate={{
                        color: isActive
                          ? "rgba(255,255,255,0.65)"
                          : "rgba(255,255,255,0.32)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 text-sm font-medium leading-relaxed line-clamp-3 text-ellipsis"
                    >
                      {t.review}
                    </motion.p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, ease: EASE_SNAP, delay: 0.15 }}
          className="mt-14 flex justify-center"
        >
          <CfaCtaButton action="modal" size="lg">
            Start Your CFA Journey
          </CfaCtaButton>
        </motion.div>
      </div>
    </section>
  );
}
