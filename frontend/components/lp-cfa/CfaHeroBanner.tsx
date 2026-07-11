"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import CfaLeadForm from "@/components/lp-cfa/CfaLeadForm";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

function HeroHeading({ className = "" }: { className?: string }) {
  return (
    <motion.h1
      variants={fadeUp}
      className={`font-jakarta font-bold leading-tight text-white ${className}`}
    >
      Become a{" "}
      <span className="text-cfa-gold">Chartered Financial Analyst</span> with
      Capital Lab
    </motion.h1>
  );
}

function HeroCtas({ className = "" }: { className?: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`flex flex-wrap gap-4 ${className}`}
    >
      <CfaCtaButton action="modal">Book a Free Counselling Call</CfaCtaButton>
      <a
        href="#cfa-syllabus"
        className="inline-flex rounded-sm border border-white/40 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-white/10"
      >
        View Curriculum
      </a>
    </motion.div>
  );
}

export default function CfaHeroBanner() {
  return (
    <>
      <section
        id="cfa-hero"
        className="relative overflow-hidden rounded-bl-[4rem] rounded-br-[4rem] bg-cfa-navy lg:flex lg:min-h-[115vh] lg:flex-col lg:items-center lg:justify-center lg:pb-28 lg:pt-24"
      >
        {/* Mobile / tablet layout: full-screen image banner with centered title + CTAs */}
        <div className="lg:hidden">
          <div className="relative h-screen w-full overflow-hidden">
            <Image
              src="/lp-cfa/hero-banner.png"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-cfa-navy/70" />

            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <HeroHeading className="mb-6 text-4xl sm:text-5xl" />
              <HeroCtas className="justify-center" />
            </motion.div>
          </div>
        </div>

        {/* Desktop layout: full-bleed background image, text + form side by side */}
        <div className="hidden lg:contents">
          <div className="absolute inset-0">
            <Image
              src="/lp-cfa/hero-banner.png"
              alt=""
              aria-hidden
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-cfa-navy/85" />

          <div className="container relative z-10 grid gap-y-14 lg:grid-cols-2 lg:items-center lg:gap-x-16">
            <motion.div
              className="max-w-xl"
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              <HeroHeading className="mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-[72px]" />
              <HeroCtas />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
              className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none lg:w-full"
            >
              <CfaLeadForm
                mode="inline"
                defaultCourse="CFA Program"
                title="Get Free CFA Counselling"
                subtitle="Share your details and our mentor will call you within 24 hours."
                formName="banner-form"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile / tablet only: form as its own section, outside the hero's clipped corners */}
      <section className="bg-white py-10 lg:hidden">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          className="container relative z-10"
        >
          <CfaLeadForm
            mode="inline"
            defaultCourse="CFA Program"
            title="Get Free CFA Counselling"
            subtitle="Share your details and our mentor will call you within 24 hours."
            formName="banner-form"
          />
        </motion.div>
      </section>
    </>
  );
}
