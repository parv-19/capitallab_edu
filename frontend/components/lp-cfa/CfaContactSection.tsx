"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import CfaLeadForm from "@/components/lp-cfa/CfaLeadForm";
import { companyInfo } from "@/lib/site-content";

const contactPoints = [
  {
    icon: Phone,
    label: "Call Us",
    value: companyInfo.phoneDisplay,
    href: companyInfo.phoneHref,
    external: false,
  },
  {
    icon: Mail,
    label: "Email Us",
    value: companyInfo.email,
    href: `mailto:${companyInfo.email}`,
    external: false,
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: companyInfo.location,
    href: companyInfo.mapUrl,
    external: true,
  },
];

export default function CfaContactSection() {
  return (
    <section id="cfa-contact" className="py-14 md:py-28">
      <div className="container">
        <div className="grid gap-10 rounded-3xl border border-gray-200 bg-cfa-cream/60 p-5 shadow-soft sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-20 lg:p-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
              Get In Touch
            </p>
            <h2 className="mb-4 font-jakarta text-2xl font-bold leading-snug text-cfa-navy sm:mb-5 sm:text-3xl md:text-5xl">
              Still Have Questions?{" "}
              <span className="text-cfa-gold">Talk To Us Directly</span>
            </h2>
            <p className="mb-6 max-w-xl text-base leading-relaxed text-gray-600 sm:mb-10 sm:text-xl">
              Share a few details and our mentor will call you back within 24
              hours to guide you on the right CFA path, batch timing, and fees.
            </p>

            <div className="space-y-4 sm:space-y-6">
              {contactPoints.map(
                ({ icon: Icon, label, value, href, external }) => (
                  <div key={label} className="flex items-start gap-3 sm:gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cfa-gold/10 sm:h-14 sm:w-14">
                      <Icon className="h-5 w-5 text-cfa-gold sm:h-6 sm:w-6" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-gray-500 sm:text-base">
                        {label}
                      </div>
                      <a
                        href={href}
                        {...(external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="text-base font-medium text-cfa-navy transition-colors hover:text-cfa-gold sm:text-xl"
                      >
                        {value}
                      </a>
                    </div>
                  </div>
                ),
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <CfaLeadForm
              mode="inline"
              defaultCourse="CFA Program"
              title="Book Your Free Counselling Call"
              subtitle="Fill in your details below and our team will reach out shortly."
              formName="contact-form"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
