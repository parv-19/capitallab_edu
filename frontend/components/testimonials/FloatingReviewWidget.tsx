"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, X } from "lucide-react";
import PublicReviewForm from "./PublicReviewForm";

export default function FloatingReviewWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
    }

    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-3 rounded-full bg-brand-navy px-4 py-3 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-brand-navy/95 sm:bottom-6 sm:right-6"
        aria-label="Open review form"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-gold text-brand-navy">
          <MessageSquareText className="h-5 w-5" />
        </span>
        <span className="pr-1">Review Us</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-end bg-slate-950/55 p-3 sm:items-center sm:justify-end sm:p-6">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-[91] w-full max-w-[560px]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              aria-label="Close review form"
            >
              <X className="h-5 w-5" />
            </button>
            <PublicReviewForm variant="modal" onSuccess={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
