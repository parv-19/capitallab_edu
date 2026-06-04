"use client";

import { useEffect, useState } from "react";
import { Star, Check, X, Bookmark, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Testimonial {
  _id: string;
  studentName: string;
  courseId: string;
  courseName?: string;
  designation?: string;
  rating: number;
  review: string;
  status: string;
  featured: boolean;
  createdAt: string;
}

interface EditFormState {
  studentName: string;
  designation: string;
  rating: number;
  review: string;
}

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    studentName: "",
    designation: "",
    rating: 5,
    review: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/admin/testimonials").then((r) => { setTestimonials(r.data?.testimonials ?? []); }).catch(() => {});
  }, []);

  const filtered = testimonials.filter((t) => t.status === activeTab);

  const refreshPublicTestimonials = async () => {
    try {
      await fetch("/api/revalidate-testimonials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Keep admin approval successful even if cache refresh fails.
    }
  };

  const approve = async (id: string) => {
    try {
      await api.patch(`/admin/testimonials/${id}/approve`);
      await refreshPublicTestimonials();
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
      await refreshPublicTestimonials();
      setTestimonials((prev) => prev.map((t) => (t._id === id ? { ...t, featured: !current } : t)));
      toast.success(current ? "Removed from featured." : "Added to featured.");
    } catch {
      toast.error("Failed.");
    }
  };

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setEditForm({
      studentName: testimonial.studentName ?? "",
      designation: testimonial.designation ?? "",
      rating: testimonial.rating || 5,
      review: testimonial.review ?? "",
    });
  };

  const closeEditModal = () => {
    if (isSaving) return;
    setEditingTestimonial(null);
  };

  const saveTestimonial = async () => {
    if (!editingTestimonial) return;
    if (!editForm.studentName.trim()) {
      toast.error("Student name is required.");
      return;
    }
    if (!editForm.review.trim()) {
      toast.error("Review is required.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        studentName: editForm.studentName.trim(),
        designation: editForm.designation.trim(),
        rating: Math.max(1, Math.min(5, editForm.rating)),
        review: editForm.review.trim(),
      };
      const response = await api.put(`/admin/testimonials/${editingTestimonial._id}`, payload);
      await refreshPublicTestimonials();
      const updated = response.data?.testimonial ?? response.data;
      setTestimonials((prev) => prev.map((t) => (t._id === editingTestimonial._id ? { ...t, ...updated } : t)));
      toast.success("Testimonial updated.");
      setEditingTestimonial(null);
    } catch {
      toast.error("Failed to update testimonial.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTestimonial = async (testimonial: Testimonial) => {
    const confirmed = window.confirm(`Delete testimonial from ${testimonial.studentName}?`);
    if (!confirmed) return;

    try {
      setDeletingId(testimonial._id);
      await api.delete(`/admin/testimonials/${testimonial._id}`);
      await refreshPublicTestimonials();
      setTestimonials((prev) => prev.filter((t) => t._id !== testimonial._id));
      toast.success("Testimonial deleted.");
    } catch {
      toast.error("Failed to delete testimonial.");
    } finally {
      setDeletingId(null);
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
                <>
                  <button
                    onClick={() => toggleFeatured(t._id, t.featured)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${t.featured ? "bg-brand-gold text-white hover:bg-amber-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    {t.featured ? "Featured" : "Mark Featured"}
                  </button>
                  <button
                    onClick={() => openEditModal(t)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => deleteTestimonial(t)}
                    disabled={deletingId === t._id}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {deletingId === t._id ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">No {activeTab} testimonials.</div>
        )}
      </div>

      {editingTestimonial ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-brand-navy">Edit Testimonial</h2>
                <p className="mt-1 text-sm text-gray-500">Approved testimonial ma direct changes kari sako cho.</p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Student Name</span>
                <input
                  value={editForm.studentName}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, studentName: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Designation</span>
                <input
                  value={editForm.designation}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, designation: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Rating</span>
                <select
                  value={editForm.rating}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} Star{rating > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Review</span>
                <textarea
                  rows={6}
                  value={editForm.review}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, review: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTestimonial}
                disabled={isSaving}
                className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy/95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
