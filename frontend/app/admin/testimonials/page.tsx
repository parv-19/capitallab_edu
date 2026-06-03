"use client";

import { useEffect, useState } from "react";
import { Star, Check, X, Bookmark } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Testimonial {
  _id: string;
  studentName: string;
  courseId: string;
  courseName?: string;
  rating: number;
  review: string;
  status: string;
  featured: boolean;
  createdAt: string;
}

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");

  useEffect(() => {
    api.get("/admin/testimonials").then((r) => { setTestimonials(r.data?.testimonials ?? []); }).catch(() => {});
  }, []);

  const filtered = testimonials.filter((t) => t.status === activeTab);

  const approve = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/approve`);
      setTestimonials((prev) => prev.map((t) => (t._id === id ? { ...t, status: "approved" } : t)));
      toast.success("Testimonial approved.");
    } catch {
      toast.error("Failed.");
    }
  };

  const reject = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/reject`);
      setTestimonials((prev) => prev.filter((t) => t._id !== id));
      toast.success("Testimonial rejected.");
    } catch {
      toast.error("Failed.");
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await api.patch(`/admin/testimonials/${id}/featured`);
      setTestimonials((prev) => prev.map((t) => (t._id === id ? { ...t, featured: !current } : t)));
      toast.success(current ? "Removed from featured." : "Added to featured.");
    } catch {
      toast.error("Failed.");
    }
  };

  const pendingCount = testimonials.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">Testimonials</h1>
        <div className="text-sm text-gray-400">{filtered.length} showing</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["pending", "approved"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex min-w-[140px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold capitalize transition-colors sm:min-w-0 ${activeTab === tab ? "bg-brand-navy text-white" : "border border-gray-200 bg-white text-gray-500 hover:border-brand-navy"}`}
          >
            {tab}
            {tab === "pending" && pendingCount > 0 && (
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${activeTab === "pending" ? "bg-white text-brand-navy" : "bg-brand-navy text-white"}`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((t) => (
          <div key={t._id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
                  {t.studentName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-brand-navy">{t.studentName}</div>
                  <div className="truncate text-xs text-brand-gold">{t.courseName}</div>
                </div>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <p className="mb-4 text-sm italic leading-relaxed text-gray-600">&ldquo;{t.review}&rdquo;</p>
            <div className="mb-4 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("en-IN")}</div>

            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "pending" && (
                <>
                  <button
                    onClick={() => approve(t._id)}
                    className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => reject(t._id)}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                </>
              )}
              {activeTab === "approved" && (
                <button
                  onClick={() => toggleFeatured(t._id, t.featured)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${t.featured ? "bg-brand-gold text-white hover:bg-amber-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {t.featured ? "Featured" : "Mark Featured"}
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">No {activeTab} testimonials.</div>
        )}
      </div>
    </div>
  );
}
