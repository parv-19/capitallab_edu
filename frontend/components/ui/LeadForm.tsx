"use client";

import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface LeadFormProps {
  mode: "modal" | "inline";
  isOpen?: boolean;
  onClose?: () => void;
  defaultCourse?: string;
}

const courseOptions = ["CMA US Program", "CFA Program", "Both Programs", "General Enquiry"];
const timeOptions = [
  "Morning (10 AM - 1 PM)",
  "Afternoon (1 PM - 4 PM)",
  "Evening (4 PM - 7:30 PM)",
];

export default function LeadForm({ mode, isOpen, onClose, defaultCourse }: LeadFormProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    courseInterest: defaultCourse ?? courseOptions[0],
    preferredTime: timeOptions[0],
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      courseInterest: defaultCourse ?? prev.courseInterest,
    }));
  }, [defaultCourse]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(form.phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/leads", form);
      setSubmitted(true);
      toast.success("We'll reach out to you shortly!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formContent = submitted ? (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Enquiry Received!</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Our team will contact you on <strong>{form.phone}</strong> within 24 hours.
        </p>
      </div>
      {mode === "modal" && onClose && (
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2 bg-brand-navy text-white rounded-lg text-sm font-medium hover:bg-brand-navyDark transition-colors"
        >
          Close
        </button>
      )}
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            name="phone"
            required
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone Number"
            maxLength={10}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email Address"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Interested In <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="courseInterest"
              required
              value={form.courseInterest}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy appearance-none bg-white transition-colors"
            >
              {courseOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Preferred Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="preferredTime"
              required
              value={form.preferredTime}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy appearance-none bg-white transition-colors"
            >
              {timeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Message (Optional)</label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          rows={3}
          placeholder="Your message or questions..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 focus:border-brand-navy resize-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-brand-gold text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending...
          </>
        ) : (
          "Send Enquiry"
        )}
      </button>
    </form>
  );

  if (mode === "inline") {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-soft">
        <h3 className="text-xl font-bold text-brand-navy mb-1">Talk to an Advisor</h3>
        <p className="text-gray-500 text-sm mb-5">Share your details and our team will guide you to the right program.</p>
        {formContent}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-brand-navy">Talk to an Advisor</h2>
              <p className="text-gray-500 text-sm mt-0.5">We&apos;ll contact you within 24 hours.</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-5">{formContent}</div>
      </div>
    </div>
  );
}
