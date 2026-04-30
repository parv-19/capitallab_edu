"use client";

import { useState, useEffect } from "react";
import { Clock, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeadForm from "@/components/ui/LeadForm";
import api from "@/lib/axios";

const mockCourses = [
  { _id: "1", title: "CA Foundation", slug: "ca-foundation", instructor: "CA Priya Mehta", shortDescription: "The perfect starting point for aspiring Chartered Accountants.", duration: "6 Months", level: "Beginner", status: "published" },
  { _id: "2", title: "CA Intermediate", slug: "ca-intermediate", instructor: "CA Rajesh Patel", shortDescription: "Crack the Intermediate exam with focused group-wise batches.", duration: "12 Months", level: "Intermediate", status: "published" },
];

export default function CoursesPage() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadCourse, setLeadCourse] = useState("");
  const [courses, setCourses] = useState(mockCourses);

  useEffect(() => {
    api.get("/courses?status=published").then(r => { if (r.data?.courses?.length) setCourses(r.data.courses); }).catch(() => {});
  }, []);

  const openLead = (title: string) => { setLeadCourse(title); setLeadOpen(true); };

  return (
    <>
      <Navbar />
      <div className="bg-hero-mesh pt-28 pb-16">
        <div className="container-shell">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-5">Our Courses</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Find Your Programme</h1>
          <p className="text-white/70 text-lg max-w-lg">Two carefully crafted courses built around the CA exam syllabus — with personal guidance at every step.</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 60L1440 60L1440 10C1200 60 900 0 720 15C540 30 240 60 0 15L0 60Z" fill="#f5f7fb" /></svg>
        </div>
      </div>

      <section className="section-pad relative">
        <div className="container-shell">
          <div className="flex flex-col gap-8">
            {courses.map((course) => (
              <div key={course._id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-64 h-48 md:h-auto bg-gradient-to-br from-brand-navy to-blue-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-16 h-16 text-white/30" />
                  </div>
                  <div className="flex-1 p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <span className="inline-block px-3 py-1 bg-brand-gold/10 text-brand-gold text-xs font-bold rounded-full mb-3">{course.level}</span>
                        <h2 className="text-2xl font-bold text-brand-navy">{course.title}</h2>
                        <p className="text-gray-400 text-sm mt-1">by {course.instructor}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-5">{course.shortDescription}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-gold" />{course.duration}</span>
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-gold" />Max 30 Students / Batch</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link href={`/courses/${course.slug}`} className="px-6 py-2.5 bg-brand-navy text-white font-semibold rounded-xl text-sm hover:bg-brand-navyDark transition-colors">
                        View Full Details
                      </Link>
                      <button onClick={() => openLead(course.title)} className="px-6 py-2.5 border border-brand-gold text-brand-gold font-semibold rounded-xl text-sm hover:bg-brand-gold hover:text-white transition-colors">
                        Enquire Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <LeadForm mode="modal" isOpen={leadOpen} onClose={() => setLeadOpen(false)} defaultCourse={leadCourse} />
    </>
  );
}
