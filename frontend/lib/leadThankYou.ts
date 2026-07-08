"use client";

const FLAG_KEY = "cfaLeadThankYou";
const VALID_MS = 5 * 60 * 1000;

interface LeadThankYouFlag {
  expiresAt: number;
}

/** Call right before navigating to the thank-you page, so it can verify the
 * visit came from a real form submission rather than a direct/typed URL. */
export function markLeadSubmitted() {
  if (typeof window === "undefined") return;

  const flag: LeadThankYouFlag = { expiresAt: Date.now() + VALID_MS };
  window.sessionStorage.setItem(FLAG_KEY, JSON.stringify(flag));
}

/** Checks whether the current visit to the thank-you page is backed by a
 * recent, real form submission. Consumes the flag on read (single-use) —
 * once the visitor leaves the thank-you page, they can only return by
 * submitting the form again. */
export function checkLeadSubmission(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.sessionStorage.getItem(FLAG_KEY);
    window.sessionStorage.removeItem(FLAG_KEY);
    if (!raw) return false;

    const flag: LeadThankYouFlag = JSON.parse(raw);
    return Boolean(flag.expiresAt) && Date.now() <= flag.expiresAt;
  } catch {
    return false;
  }
}
