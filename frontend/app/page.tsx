"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Users, Star, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeadForm from "@/components/ui/LeadForm";
import api from "@/lib/axios";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const mockCourses = [
  { _id: "1", title: "CA Foundation", slug: "ca-foundation", instructor: "CA Priya Mehta",
    description: "Build a rock-solid foundation with coverage of Accounts, Maths, Law & Economics plus full mock-test support.", duration: "6 Months", level: "Beginner" },
  { _id: "2", title: "CA Intermediate", slug: "ca-intermediate", instructor: "CA Rajesh Patel",
    description: "Comprehensive Group I & II coverage with advanced problem-solving, revision tests, and personal mentoring.", duration: "12 Months", level: "Intermediate" },
];

const mockTestimonials = [
  { _id: "t1", studentName: "Ananya Shah", rating: 5, review: "The personal attention from faculty made all the difference. Cleared Foundation in first attempt!" },
  { _id: "t2", studentName: "Karan Thakkar", rating: 5, review: "Capital Lab's structured approach helped me score in the top 5% nationwide in Intermediate." },
  { _id: "t3", studentName: "Diya Patel", rating: 5, review: "From mock tests to doubt sessions — every resource was top notch. Highly recommend!" },
];

const valueProps = [
  { icon: Users, title: "Expert Faculty", desc: "Learn from practicing CAs with 10+ years of teaching and real industry insights." },
  { icon: Star, title: "Proven Results", desc: "98% of students clear on first attempt, consistently outperforming the national average." },
  { icon: BookOpen, title: "Personal Attention", desc: "Small batches of max 30 students ensure every doubt gets addressed every session." },
];

export default function Home() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [courses, setCourses] = useState(mockCourses);
  const [testimonials, setTestimonials] = useState(mockTestimonials);
  const valueSec = useInView();
  const coursesSec = useInView();
  const stepsSec = useInView();
  const testimSec = useInView();

  useEffect(() => {
    api.get("/courses?status=published").then(r => { if (r.data?.courses?.length) setCourses(r.data.courses); }).catch(() => {});
    api.get("/testimonials?featured=true&limit=3").then(r => { if (r.data?.testimonials?.length) setTestimonials(r.data.testimonials); }).catch(() => {});
  }, []);

  return (
    <>
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-hero-mesh overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="container-shell relative z-10 pt-24 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, staggerChildren: 0.1 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" /> Ahmedabad&apos;s Premier CA Coaching
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-5">
                Unlock Your<br /><span className="text-brand-gold">Potential</span>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-md">
                Expert CA coaching with personal attention, proven curriculum, and a track record that speaks for itself.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="#courses" className="px-7 py-3 bg-brand-gold text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors flex items-center gap-2">
                  Explore Courses <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={() => setLeadOpen(true)} className="px-7 py-3 border border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                  Book a Free Visit
                </button>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="glass-panel rounded-2xl p-8 hidden lg:block">
              <p className="text-white/60 text-sm font-medium mb-6 uppercase tracking-wider">Our Impact</p>
              <div className="grid grid-cols-2 gap-6">
                {[["500+", "Students Enrolled"], ["98%", "Success Rate"], ["5★", "Average Rating"], ["10+", "Years of Excellence"]].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <div className="text-4xl font-extrabold text-brand-gold mb-1">{v}</div>
                    <div className="text-white/60 text-sm">{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 20C1200 80 900 0 720 20C540 40 240 80 0 20L0 80Z" fill="#f5f7fb" />
          </svg>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="section-pad" ref={valueSec.ref}>
        <div className="container-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={valueSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3">Why Capital Lab?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Everything a serious CA aspirant needs — under one roof in Ahmedabad.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {valueProps.map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 30 }} animate={valueSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.08 }}
                className="bg-white rounded-2xl p-7 shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-brand-navy/5 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-brand-gold" />
                </div>
                <h3 className="text-lg font-bold text-brand-navy mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSES */}
      <section id="courses" className="section-pad bg-white" ref={coursesSec.ref}>
        <div className="container-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={coursesSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3">Our Courses</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Two flagship programmes designed for clarity, depth and exam-day confidence.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8">
            {courses.map((course, i) => (
              <motion.div key={course._id} initial={{ opacity: 0, y: 30 }} animate={coursesSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.12 }}
                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-soft hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="h-44 bg-gradient-to-br from-brand-navy to-blue-600 flex items-center justify-center relative">
                  <BookOpen className="w-14 h-14 text-white/30" />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-brand-gold text-white text-xs font-bold rounded-full">{course.level}</div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.duration}</span>
                    <span>·</span><span>{course.instructor}</span>
                  </div>
                  <h3 className="text-xl font-bold text-brand-navy mb-2">{course.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">{course.description}</p>
                  <div className="flex items-center gap-3">
                    <Link href={`/courses/${course.slug}`} className="flex-1 text-center py-2.5 bg-brand-navy text-white font-semibold rounded-xl text-sm hover:bg-brand-navyDark transition-colors">Know More →</Link>
                    <button onClick={() => setLeadOpen(true)} className="flex-1 py-2.5 border border-brand-gold text-brand-gold font-semibold rounded-xl text-sm hover:bg-brand-gold hover:text-white transition-colors">Enquire Now</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section-pad" ref={stepsSec.ref}>
        <div className="container-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={stepsSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-md mx-auto">Three simple steps to begin your CA journey.</p>
          </motion.div>
          <div className="relative flex flex-col md:flex-row gap-8 items-start">
            <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-px border-t-2 border-dashed border-brand-gold/30" />
            {[["01","Browse & Enquire","Explore our courses and submit a quick enquiry form."],["02","Visit Our Centre","Meet faculty, tour the facility and get all questions answered."],["03","Start Learning","Enroll, get your dashboard access, begin your CA journey."]].map(([n, title, desc], i) => (
              <motion.div key={n} initial={{ opacity: 0, y: 30 }} animate={stepsSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.12 }}
                className="flex-1 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-brand-gold flex items-center justify-center text-white text-2xl font-extrabold shadow-lg mb-5 relative z-10">{n}</div>
                <h3 className="text-lg font-bold text-brand-navy mb-2">{title}</h3>
                <p className="text-gray-500 text-sm max-w-xs">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section-pad bg-white" ref={testimSec.ref}>
        <div className="container-shell">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={testimSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3">Student Success Stories</h2>
            <p className="text-gray-500 max-w-md mx-auto">Don&apos;t take our word for it — hear directly from our students.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t._id} initial={{ opacity: 0, y: 30 }} animate={testimSec.inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-sm">{t.studentName.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-brand-navy text-sm">{t.studentName}</div>
                    <div className="text-xs text-brand-gold">CA Student</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
                <p className="text-gray-600 text-sm italic leading-relaxed">&ldquo;{t.review}&rdquo;</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/testimonials" className="inline-flex items-center gap-2 text-brand-navy font-semibold hover:text-brand-gold transition-colors">
              View All Testimonials <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="bg-brand-navy py-16">
        <div className="container-shell text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Start your success story today</h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">Join hundreds of students who cleared their CA exams on the first attempt with Capital Lab.</p>
          <button onClick={() => setLeadOpen(true)} className="px-8 py-4 bg-brand-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg text-lg">
            Book Free Consultation
          </button>
        </div>
      </section>

      <Footer />
      <LeadForm mode="modal" isOpen={leadOpen} onClose={() => setLeadOpen(false)} />
    </>
  );
}
