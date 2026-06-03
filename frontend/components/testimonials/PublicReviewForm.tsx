"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const courseOptions = [
  { value: "", label: "General / Not specific" },
  { value: "course-cfa", label: "CFA" },
  { value: "course-cma-us", label: "CMA US" },
];

export default function PublicReviewForm() {
  const [studentName, setStudentName] = useState("");
  const [designation, setDesignation] = useState("");
  const [courseId, setCourseId] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!studentName.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!designation.trim()) {
      toast.error("Please enter your designation.");
      return;
    }
    if (!review.trim()) {
      toast.error("Please write your review.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/testimonials/public", {
        studentName,
        designation,
        courseId: courseId || undefined,
        rating,
        review,
      });
      toast.success("Review submitted. It will appear after admin approval.");
      setStudentName("");
      setDesignation("");
      setCourseId("");
      setReview("");
      setRating(5);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-pad">
      <div className="container-shell">
        <div className="mx-auto max-w-2xl rounded-3xl border border-gray-100 bg-white p-6 shadow-soft sm:p-8">
          <div className="mb-6">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-gold">
              Share Feedback
            </div>
            <h2 className="text-3xl font-extrabold text-brand-navy">Leave a Review</h2>
            <p className="mt-2 text-sm text-gray-500">
              Your review goes to admin approval first, then it appears on the public site.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-brand-navy">Your Name</span>
                <input
                  value={studentName}
                  onChange={(event) => setStudentName(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
                  placeholder="Enter your full name"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-brand-navy">Designation</span>
                <input
                  value={designation}
                  onChange={(event) => setDesignation(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
                  placeholder="Example: CFA Student - Capital Lab Education"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-brand-navy">Program</span>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
              >
                {courseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="mb-2 block text-sm font-medium text-brand-navy">Star Rating</div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const starValue = index + 1;
                  const active = starValue <= rating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      className="rounded-full p-1 transition hover:scale-105"
                      aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-7 w-7 ${active ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-brand-navy">Your Review</span>
              <textarea
                value={review}
                onChange={(event) => setReview(event.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-brand-navy"
                placeholder="Write your experience with Capital Lab Education"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-w-[180px] items-center justify-center rounded-2xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
