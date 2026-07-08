"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { testimonials } from "@/lib/site-content";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

const AUTOPLAY_DELAY = 4000;
const swiperModules = [Navigation, Autoplay];
const swiperBreakpoints = {
  640: { slidesPerView: 1.4, spaceBetween: 28 },
  1024: { slidesPerView: 2.3, spaceBetween: 40 },
};
const autoplayConfig = {
  delay: AUTOPLAY_DELAY,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
};

// Swiper's loop mode needs enough real slides to duplicate for a seamless wrap;
// with only 4 testimonials and slidesPerView up to 2.3, loop silently breaks
// (confirmed via Swiper's own console warning + slideNext() not advancing realIndex).
// Repeating the data set gives it enough slides to loop correctly.
const loopedTestimonials = [...testimonials, ...testimonials, ...testimonials];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DotFill() {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    setFilled(false);
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setFilled(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  return (
    <span
      className="absolute inset-y-0 left-0 rounded-full bg-cfa-gold transition-[width] ease-linear"
      style={{
        width: filled ? "100%" : "0%",
        transitionDuration: `${AUTOPLAY_DELAY}ms`,
      }}
    />
  );
}

export default function CfaTestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    const swiper = swiperRef.current;
    if (
      !swiper ||
      typeof swiper.params.navigation === "boolean" ||
      !swiper.params.navigation
    ) {
      return;
    }
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
  }, []);

  return (
    <section
      id="cfa-testimonials"
      className="overflow-hidden bg-cfa-navy py-20 md:py-28"
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
            Student Success Stories
          </p>
          <h2 className="font-jakarta text-3xl font-bold leading-snug text-white md:text-5xl">
            What Our <span className="text-cfa-gold">Students Say</span>
          </h2>
        </motion.div>
      </div>

      <div className="relative w-full">
        <Swiper
          modules={swiperModules}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onBeforeInit={(swiper) => {
            if (
              typeof swiper.params.navigation !== "boolean" &&
              swiper.params.navigation
            ) {
              swiper.params.navigation.prevEl = prevRef.current;
              swiper.params.navigation.nextEl = nextRef.current;
            }
          }}
          navigation
          loop
          observer
          observeParents
          centeredSlides
          autoplay={autoplayConfig}
          slidesPerView={1.05}
          spaceBetween={24}
          breakpoints={swiperBreakpoints}
          onSlideChange={(swiper) =>
            setActiveIndex(swiper.realIndex % testimonials.length)
          }
          className="!py-4"
        >
          {loopedTestimonials.map((testimonial, slideIndex) => (
            <SwiperSlide
              key={`${testimonial._id}-${slideIndex}`}
              className="!h-auto"
            >
              {({ isActive }) => (
                <motion.div
                  animate={{
                    scale: isActive ? 1 : 0.9,
                    opacity: isActive ? 1 : 0.45,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex h-full flex-col rounded-2xl bg-white p-8 shadow-2xl md:p-10"
                >
                  <Quote
                    className="mb-4 h-10 w-10 text-cfa-gold/40"
                    fill="currentColor"
                  />
                  <div className="mb-3 flex gap-1">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-6 w-6 ${
                          starIndex < testimonial.rating
                            ? "fill-cfa-gold text-cfa-gold"
                            : "fill-gray-200 text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mb-6 flex-1 text-xl leading-relaxed text-gray-600">
                    &ldquo;{testimonial.review}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cfa-navy text-lg font-bold text-cfa-gold">
                      {initials(testimonial.studentName)}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-cfa-navy">
                        {testimonial.studentName}
                      </div>
                      <div className="text-md text-gray-500">
                        {testimonial.courseName}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="container">
        <div className="mt-10 flex items-center justify-between gap-6">
          <div className="hidden w-[100px] shrink-0 md:block" aria-hidden />

          <div className="mx-auto flex items-center gap-2.5">
            {testimonials.map((testimonial, index) => (
              <button
                key={testimonial._id}
                type="button"
                aria-label={`Go to testimonial ${index + 1}`}
                onClick={() => swiperRef.current?.slideToLoop(index)}
                className={`relative overflow-hidden rounded-full bg-white/20 transition-all duration-300 ${
                  index === activeIndex ? "h-2.5 w-9" : "h-2.5 w-2.5"
                }`}
              >
                {index === activeIndex && <DotFill />}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 gap-3">
            <button
              ref={prevRef}
              type="button"
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-cfa-gold hover:bg-cfa-gold hover:text-cfa-navy"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              ref={nextRef}
              type="button"
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-cfa-gold hover:bg-cfa-gold hover:text-cfa-navy"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mt-12 flex justify-center"
        >
          <CfaCtaButton action="modal" size="lg">
            Start Your CFA Journey
          </CfaCtaButton>
        </motion.div>
      </div>
    </section>
  );
}
