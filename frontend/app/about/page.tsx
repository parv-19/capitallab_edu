"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Target, Award, Heart, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeadForm from "@/components/ui/LeadForm";

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

const timeline = [
  { year: "2014", title: "Capital Lab Founded", desc: "Started with a small batch of 15 CA Foundation students in a rented hall in Navrangpura." },
  { year: "2017", title: "First 100% Results", desc: "Our entire Foundation batch cleared the exam — a milestone that defined our teaching philosophy." },
  { year: "2020", title: "Intermediate Wing Launched", desc: "Expanded to CA Intermediate with Group I & II batches and dedicated faculty." },
  { year: "2024", title: "500+ Alumni Strong", desc: "Crossed 500 successful alumni with consistent top-10 national rankings from our students." },
];

const team = [
  { name: "CA Priya Mehta", role: "CA Foundation Head", bio: "15 years of teaching experience. AIR 12 in CA Final. Specialises in Accounts and Law.", tags: ["Accounts", "Law", "Economics"] },
  { name: "CA Rajesh Patel", role: "CA Intermediate Head", bio: "Former Big4 auditor, 10 years in coaching. Known for simplifying complex SFM concepts.", tags: ["SFM", "Audit", "Costing"] },
  { name: "CA Neha Shah", role: "Maths & Stats Faculty", bio: "M.Sc. Mathematics, 8 years of coaching CA Foundation Maths with a 100% pass rate.", tags: ["Maths", "Statistics"] },
];

const values = [
  { icon: Target, title: "Quality First", desc: "No shortcuts. Every concept is taught to its depth with real exam application." },
  { icon: Award, title: "Affordability", desc: "World-class coaching at fees that every aspirant can access — no hidden costs." },
  { icon: Users, title: "Personal Attention", desc: "Small batches ensure every student is seen, heard, and guided personally." },
  { icon: Heart, title: "Community", desc: "We celebrate every student's success as our own — a family, not just a coaching." },
];

export default function AboutPage() {
  const [leadOpen, setLeadOpen] = useState(false);
  const heroSec = useInView();
  const timelineSec = useInView();
  const teamSec = useInView();
  const valuesSec = useInView();

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="bg-hero-mesh pt-28 pb-20 relative">
        <div className="container-shell relative z-10">
          <div className="max-w-3xl" ref={heroSec.ref}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={heroSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-5">
                About Us
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5">
                A decade of <span className="text-brand-gold">shaping futures</span>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                Capital Lab Education was founded with one mission: to make quality CA coaching accessible to every serious aspirant in Ahmedabad. We believe that with the right guidance, hard work, and personal support — every student can clear the CA exam.
              </p>
              <p className="text-white/60 leading-relaxed">
                Today, we&apos;re proud to have 500+ alumni who are practising Chartered Accountants, finance leaders, and entrepreneurs — all of whom started their journey here.
              </p>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 60L1440 60L1440 10C1200 60 900 0 720 15C540 30 240 60 0 15L0 60Z" fill="#f5f7fb" /></svg>
        </div>
      </section>

      {/* STATS */}
      <section className="section-pad">
        <div className="container-shell">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[{ target: 500, suffix: "+", label: "Students Enrolled" }, { target: 98, suffix: "%", label: "First-Attempt Success" }, { target: 10, suffix: "+", label: "Years of Excellence" }, { target: 3, suffix: "", label: "Expert Faculty" }].map(({ target, suffix, label }) => (
              <div key={label} className="bg-white rounded-2xl p-6 text-center shadow-soft">
                <div className="text-4xl font-extrabold text-brand-navy mb-1">
                  <AnimatedCounter target={target} suffix={suffix} />
                </div>
                <div className="text-gray-500 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="section-pad bg-white" ref={timelineSec.ref}>
        <div className="container-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={timelineSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-14">
            <h2 className="text-3xl font-bold text-brand-navy mb-3">Our Journey</h2>
            <p className="text-gray-500 max-w-md mx-auto">A decade of milestones that shaped who we are.</p>
          </motion.div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-brand-gold/20 hidden md:block" />
            <div className="flex flex-col gap-10">
              {timeline.map(({ year, title, desc }, i) => (
                <motion.div key={year} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} animate={timelineSec.inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-6 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}>
                  <div className={`flex-1 ${i % 2 !== 0 ? "md:text-right" : ""}`}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
                      <div className="text-brand-gold font-bold text-sm mb-2">{year}</div>
                      <h3 className="text-lg font-bold text-brand-navy mb-2">{title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-brand-gold flex items-center justify-center text-white text-xs font-bold shrink-0 z-10 shadow-lg">{year.slice(2)}</div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="section-pad" ref={teamSec.ref}>
        <div className="container-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={teamSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-navy mb-3">Meet the Faculty</h2>
            <p className="text-gray-500 max-w-md mx-auto">Industry veterans who teach with passion and purpose.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {team.map(({ name, role, bio, tags }, i) => (
              <motion.div key={name} initial={{ opacity: 0, y: 30 }} animate={teamSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-7 shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-16 h-16 rounded-2xl bg-brand-navy flex items-center justify-center text-2xl font-extrabold text-white mb-5">{name.charAt(3)}</div>
                <h3 className="font-bold text-brand-navy text-lg mb-1">{name}</h3>
                <div className="text-brand-gold text-xs font-semibold mb-3">{role}</div>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{bio}</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map(t => <span key={t} className="px-2.5 py-1 bg-brand-navy/5 text-brand-navy text-xs rounded-full font-medium">{t}</span>)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="section-pad bg-white" ref={valuesSec.ref}>
        <div className="container-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={valuesSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-navy mb-3">Our Values</h2>
            <p className="text-gray-500 max-w-md mx-auto">The principles that guide every decision we make.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 30 }} animate={valuesSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.08 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
                <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-gold" />
                </div>
                <h3 className="font-bold text-brand-navy mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-navy py-14">
        <div className="container-shell text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start your CA journey?</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">Book a free visit to our centre and meet our faculty in person.</p>
          <button onClick={() => setLeadOpen(true)} className="px-8 py-4 bg-brand-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg text-lg">
            Book Free Visit
          </button>
        </div>
      </section>

      <Footer />
      <LeadForm mode="modal" isOpen={leadOpen} onClose={() => setLeadOpen(false)} />
    </>
  );
}
