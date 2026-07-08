"use client";

import { useState } from "react";
import { Award, GraduationCap, Smile, Users } from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { stats } from "@/lib/site-content";

const icons = [GraduationCap, Users, Award, Smile];

export default function CfaCounterSection() {
  const [viewKey, setViewKey] = useState(0);

  return (
    <section
      id="cfa-counter"
      className="relative bg-white pb-12 pt-10 lg:pb-32 lg:pt-0"
    >
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          onViewportEnter={() => setViewKey((k) => k + 1)}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-lg lg:absolute lg:inset-x-0 lg:top-[-7rem] lg:z-10 lg:border-0 lg:px-14 lg:py-12 lg:shadow-2xl"
        >
          <div className="grid grid-cols-2 gap-y-8 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-gray-100">
            {stats.map(({ label, numericValue, suffix }, index) => {
              const Icon = icons[index % icons.length];
              return (
                <div
                  key={label}
                  className="flex flex-col items-center px-2 text-center lg:px-6"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cfa-gold/10">
                    <Icon className="h-6 w-6 text-cfa-gold" />
                  </div>
                  <div className="font-jakarta text-4xl font-bold text-cfa-navy lg:text-5xl">
                    <CountUp
                      key={`${label}-${viewKey}`}
                      end={numericValue}
                      suffix={suffix}
                      duration={2.2}
                    />
                  </div>
                  <div className="mt-2 text-base text-gray-500">{label}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
