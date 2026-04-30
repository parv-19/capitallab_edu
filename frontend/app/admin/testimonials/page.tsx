"use client";

import { useState, useEffect } from "react";
import { Star, Check, X, Bookmark } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Testimonial { _id: string; studentName: string; courseId: string; courseName?: string; rating: number; review: string; status: string; featured: boolean; createdAt: string; }

const mockTestimonials: Testimonial[] = [
  { _id: "t1", studentName: "Arjun Mehta", courseId: "1", courseName: "CA Foundation", rating: 5, review: "Excellent coaching. The personal attention is unmatched.", status: "pending", featured: false, createdAt: "2026-04-28T00:00:00Z" },
  { _id: "t2", studentName: "Priya Shah", courseId: "2", courseName: "CA Intermediate", rating: 5, review: "Cleared Intermediate in first attempt. Capital Lab's mock tests were key.", status: "approved", featured: true, createdAt: "2026-04-20T00:00:00Z" },
  { _id: "t3", studentName: "Rohan Desai", courseId: "1", courseName: "CA Foundation", rating: 4, review: "Great faculty. Could have more online resources though.", status: "pending", featured: false, createdAt: "2026-04-18T00:00:00Z" },
  { _id: "t4", studentName: "Nidhi Joshi", courseId: "2", courseName: "CA Intermediate", rating: 5, review: "Best coaching in Ahmedabad. Period.", status: "approved", featured: false, createdAt: "2026-04-10T00:00:00Z" },
];

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(mockTestimonials);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  useEffect(() => {
    api.get("/admin/testimonials").then(r => { if (r.data?.testimonials?.length) setTestimonials(r.data.testimonials); }).catch(() => {});
  }, []);

  const filtered = testimonials.filter(t => t.status === activeTab);

  const approve = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/approve`);
      setTestimonials(prev => prev.map(t => t._id === id ? { ...t, status: "approved" } : t));
      toast.success("Testimonial approved.");
    } catch { toast.error("Failed."); }
  };

  const reject = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/reject`);
      setTestimonials(prev => prev.filter(t => t._id !== id));
      toast.success("Testimonial rejected.");
    } catch { toast.error("Failed."); }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.patch(`/admin/testimonials/${id}/featured`);
      setTestimonials(prev => prev.map(t => t._id === id ? { ...t, featured: !current } : t));
      toast.success(current ? "Removed from featured." : "Added to featured.");
    } catch { toast.error("Failed."); }
  };

  const pendingCount = testimonials.filter(t => t.status === "pending").length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">Testimonials</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["pending", "approved"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors flex items-center gap-2 ${activeTab === tab ? "bg-brand-navy text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-brand-navy"}`}>
            {tab}
            {tab === "pending" && pendingCount > 0 && (
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${activeTab === "pending" ? "bg-white text-brand-navy" : "bg-brand-navy text-white"}`}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map(t => (
          <div key={t._id} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold text-sm">
                  {t.studentName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-brand-navy text-sm">{t.studentName}</div>
                  <div className="text-xs text-brand-gold">{t.courseName}</div>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
            </div>

            <p className="text-gray-600 text-sm italic leading-relaxed mb-4">&ldquo;{t.review}&rdquo;</p>

            <div className="text-xs text-gray-400 mb-4">{new Date(t.createdAt).toLocaleDateString("en-IN")}</div>

            <div className="flex items-center gap-2 flex-wrap">
              {activeTab === "pending" && (
                <>
                  <button onClick={() => approve(t._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => reject(t._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              )}
              {activeTab === "approved" && (
                <button onClick={() => toggleFeatured(t._id, t.featured)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${t.featured ? "bg-brand-gold text-white hover:bg-amber-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  <Bookmark className="w-3.5 h-3.5" />
                  {t.featured ? "Featured ✓" : "Mark Featured"}
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-2 text-center py-12 text-gray-400">No {activeTab} testimonials.</div>}
      </div>
    </div>
  );
}
