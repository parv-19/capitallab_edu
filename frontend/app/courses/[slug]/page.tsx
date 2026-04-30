"use client";

import { useState, useEffect } from "react";
import { Clock, Users, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeadForm from "@/components/ui/LeadForm";
import api from "@/lib/axios";

interface Lesson { _id: string; title: string; sectionName: string; duration: string; isFreePreview: boolean; order: number; }

const mockData: Record<string, { title: string; instructor: string; duration: string; level: string; description: string; shortDescription: string; lessons: Lesson[] }> = {
  "ca-foundation": {
    title: "CA Foundation", instructor: "CA Priya Mehta", duration: "6 Months", level: "Beginner",
    shortDescription: "The perfect starting point for aspiring Chartered Accountants.",
    description: "CA Foundation is designed to give you a rock-solid base in Accounting Principles, Business Mathematics & Statistics, Mercantile Law, and Business Economics. Our structured batch schedule, regular mock tests, and doubt-clearing sessions ensure you are fully prepared for exam day.",
    lessons: [
      { _id: "l1", sectionName: "Principles of Accounting", title: "Introduction to Accounting", duration: "45 min", isFreePreview: true, order: 1 },
      { _id: "l2", sectionName: "Principles of Accounting", title: "Journal Entries & Ledger", duration: "60 min", isFreePreview: false, order: 2 },
      { _id: "l3", sectionName: "Business Mathematics", title: "Ratio and Proportion", duration: "50 min", isFreePreview: true, order: 3 },
      { _id: "l4", sectionName: "Business Mathematics", title: "Time Value of Money", duration: "55 min", isFreePreview: false, order: 4 },
      { _id: "l5", sectionName: "Mercantile Law", title: "Indian Contract Act Overview", duration: "40 min", isFreePreview: false, order: 5 },
    ],
  },
  "ca-intermediate": {
    title: "CA Intermediate", instructor: "CA Rajesh Patel", duration: "12 Months", level: "Intermediate",
    shortDescription: "Crack the Intermediate exam with focused group-wise batches.",
    description: "CA Intermediate at Capital Lab covers both Group I (Accounting, Corporate Laws, Costing, Taxation) and Group II (Advanced Accounting, Auditing, EIS/SM, Financial Management). We offer separate group batches, extensive revision tests, and one-on-one mentoring to maximise your score.",
    lessons: [
      { _id: "l1", sectionName: "Group I — Accounting", title: "Company Accounts — Issue of Shares", duration: "60 min", isFreePreview: true, order: 1 },
      { _id: "l2", sectionName: "Group I — Costing", title: "Marginal Costing Fundamentals", duration: "55 min", isFreePreview: false, order: 2 },
      { _id: "l3", sectionName: "Group I — Taxation", title: "Income Tax — Residential Status", duration: "50 min", isFreePreview: true, order: 3 },
      { _id: "l4", sectionName: "Group II — Auditing", title: "Audit Planning & Procedures", duration: "65 min", isFreePreview: false, order: 4 },
      { _id: "l5", sectionName: "Group II — Financial Management", title: "Capital Structure Theories", duration: "70 min", isFreePreview: false, order: 5 },
    ],
  },
};

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "instructor">("overview");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [course, setCourse] = useState(mockData[params.slug]);

  useEffect(() => {
    api.get(`/courses/${params.slug}`).then(r => { if (r.data?.course) setCourse(r.data.course); }).catch(() => {});
  }, [params.slug]);

  if (!course) return notFound();

  const sections = [...new Set(course.lessons.map(l => l.sectionName))];
  const toggleSection = (s: string) => setOpenSections(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="bg-hero-mesh pt-28 pb-16">
        <div className="container-shell">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-brand-gold text-white text-xs font-bold rounded-full mb-4">{course.level}</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{course.title}</h1>
            <p className="text-white/70 text-lg mb-5">{course.shortDescription}</p>
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-gold" />{course.duration}</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-gold" />Max 30 per Batch</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-brand-gold" />{course.instructor}</span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 60L1440 60L1440 10C1200 60 900 0 720 15C540 30 240 60 0 15L0 60Z" fill="#f5f7fb" /></svg>
        </div>
      </div>

      <section className="section-pad relative">
        <div className="container-shell">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main */}
            <div className="flex-1 min-w-0">
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
                {(["overview", "curriculum", "instructor"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "bg-white text-brand-navy shadow-sm" : "text-gray-500 hover:text-brand-navy"}`}>
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="bg-white rounded-2xl p-7 shadow-soft">
                  <h2 className="text-xl font-bold text-brand-navy mb-4">About this Course</h2>
                  <p className="text-gray-600 leading-relaxed">{course.description}</p>
                  <div className="mt-6 grid sm:grid-cols-3 gap-4">
                    {[["Duration", course.duration], ["Level", course.level], ["Instructor", course.instructor]].map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-xl p-4">
                        <div className="text-xs text-gray-400 mb-1">{k}</div>
                        <div className="font-semibold text-brand-navy text-sm">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "curriculum" && (
                <div className="space-y-3">
                  {sections.map(section => {
                    const lessons = course.lessons.filter(l => l.sectionName === section).sort((a, b) => a.order - b.order);
                    const isOpen = openSections.has(section);
                    return (
                      <div key={section} className="bg-white rounded-2xl shadow-soft overflow-hidden">
                        <button onClick={() => toggleSection(section)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                          <span className="font-semibold text-brand-navy">{section}</span>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>{lessons.length} lessons</span>
                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-gray-100">
                            {lessons.map(lesson => (
                              <div key={lesson._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-brand-navy/10 flex items-center justify-center">
                                    <BookOpen className="w-3 h-3 text-brand-navy" />
                                  </div>
                                  <span className="text-sm text-gray-700">{lesson.title}</span>
                                  {lesson.isFreePreview && <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">Free Preview</span>}
                                </div>
                                <span className="text-xs text-gray-400">{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "instructor" && (
                <div className="bg-white rounded-2xl p-7 shadow-soft">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-brand-navy flex items-center justify-center text-2xl font-extrabold text-white">{course.instructor.charAt(3)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-brand-navy">{course.instructor}</h3>
                      <div className="text-brand-gold text-sm font-medium">{course.title} Faculty</div>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Our lead instructor brings years of practical experience as a practising CA combined with deep expertise in exam strategy. Known for simplifying complex topics and building student confidence through structured practice sessions.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 shrink-0">
              <div className="sticky top-24">
                <LeadForm mode="inline" defaultCourse={course.title} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 p-4 z-40">
        <button onClick={() => setLeadOpen(true)} className="w-full py-3 bg-brand-gold text-white font-bold rounded-xl hover:bg-amber-600 transition-colors">
          Enquire Now
        </button>
      </div>

      <Footer />
      <LeadForm mode="modal" isOpen={leadOpen} onClose={() => setLeadOpen(false)} defaultCourse={course.title} />
    </>
  );
}
