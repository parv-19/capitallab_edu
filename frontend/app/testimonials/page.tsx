"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import api from "@/lib/axios";

const mockTestimonials = [
  { _id: "t1", studentName: "Ananya Shah", courseId: "ca-foundation", courseName: "CA Foundation", rating: 5, review: "The personal attention from faculty made all the difference. I cleared my Foundation in first attempt! The mock tests were incredibly realistic." },
  { _id: "t2", studentName: "Karan Thakkar", courseId: "ca-intermediate", courseName: "CA Intermediate", rating: 5, review: "Capital Lab's structured approach to Intermediate groups helped me score in the top 5% nationwide. Couldn't have done it without the weekly revision tests." },
  { _id: "t3", studentName: "Diya Patel", courseId: "ca-foundation", courseName: "CA Foundation", rating: 5, review: "From mock tests to doubt sessions — every resource was top notch. Highly recommend to any CA aspirant in Ahmedabad." },
  { _id: "t4", studentName: "Rohan Desai", courseId: "ca-intermediate", courseName: "CA Intermediate", rating: 5, review: "CA Rajesh sir breaks down SFM in a way that no textbook can. I finally understood Capital Structure theories thanks to his analogies." },
  { _id: "t5", studentName: "Priya Joshi", courseId: "ca-foundation", courseName: "CA Foundation", rating: 5, review: "Small batch size meant I never had a doubt left unanswered. The faculty genuinely cares about every student's progress." },
  { _id: "t6", studentName: "Arjun Mehta", courseId: "ca-intermediate", courseName: "CA Intermediate", rating: 5, review: "Cleared both groups in one shot. Capital Lab's study material and practice questions were spot-on for the ICAI pattern." },
];

const FILTERS = ["All", "CA Foundation", "CA Intermediate"];

export default function TestimonialsPage() {
  const [filter, setFilter] = useState("All");
  const [testimonials, setTestimonials] = useState(mockTestimonials);

  useEffect(() => {
    api.get("/testimonials?status=approved").then(r => { if (r.data?.testimonials?.length) setTestimonials(r.data.testimonials); }).catch(() => {});
  }, []);

  const filtered = filter === "All" ? testimonials : testimonials.filter(t => t.courseName === filter);

  return (
    <>
      <Navbar />

      <div className="bg-hero-mesh pt-28 pb-16 relative">
        <div className="container-shell">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-5">Student Stories</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">What Our Students Say</h1>
          <p className="text-white/70 text-lg max-w-lg">500+ success stories and counting. Real students, real results.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 60L1440 60L1440 10C1200 60 900 0 720 15C540 30 240 60 0 15L0 60Z" fill="#f5f7fb" /></svg>
        </div>
      </div>

      <section className="section-pad relative">
        <div className="container-shell">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-10 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${filter === f ? "bg-brand-navy text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-brand-navy hover:text-brand-navy"}`}>
                {f}
              </button>
            ))}
          </div>

          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filtered.map(t => (
              <div key={t._id} className="break-inside-avoid bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-brand-navy text-sm">{t.studentName}</div>
                    <div className="text-xs text-brand-gold">{t.courseName}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-600 text-sm italic leading-relaxed">&ldquo;{t.review}&rdquo;</p>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">No testimonials found for this filter.</div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
