"use client";

import { useEffect } from "react";
import Link from "next/link";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export default function ThankYouClient() {
  useEffect(() => {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: "generate_lead" });
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0d1b3e] px-6 text-center">
      <div className="flex flex-col items-center gap-6 max-w-md w-full">
        <div className="w-20 h-20 rounded-full bg-[#c9a84c]/15 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#c9a84c]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Thank You!</h1>
          <p className="text-[#c9a84c] font-semibold text-lg">We got your enquiry.</p>
          <p className="text-slate-300 text-sm leading-relaxed mt-1">
            Our team will reach out within 2 hours to schedule your free counselling call.
          </p>
        </div>

        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 bg-[#c9a84c] text-[#0d1b3e] font-bold text-sm px-6 py-3 rounded-full hover:bg-[#e0be6a] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>
      </div>
    </main>
  );
}
